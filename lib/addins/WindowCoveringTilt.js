/* Sample module - Simple handler for rolling shutter actuator  
 * 
 */
/* jshint esversion: 6, strict: true, node: true */
'use strict';

/**
 * @type {WindowCovering}
 */
var WindowCovering = require('./WindowCovering.js');
var log = require('debug')('WindowCoveringTilt');

/**
 * @class A custom handler for the "Jalousie Aktor" (rolling shutter/blinds actuator) - including Tilt
 * @extends WindowCovering
 */
class WindowCoveringTilt extends WindowCovering {

	/*******************************************************************************************************************
	 * onKNXValueChange is invoked if a Bus value for one of the bound addresses is received
	 * 
	 */
	onKNXValueChange(field, oldValue, knxValue) {
		super.onKNXValueChange(field, oldValue, knxValue);
		var newValue;
		
		if (field === "TargetHorizontalTiltAngle") {
			// TargetPosition is DPT5.001 Percentage (0..255)
			// need to convert to (-90..90) first
			// Homekit is using degrees

			var ninetyDegRotation = this.myAPI.getLocalConstant("ninetyDegRotation");
			
			// is the Shutter one with a full rotation or one with 90° only?
			if (ninetyDegRotation===true) {		
				newValue = 0 + knxValue/255 * 90;
			} else {
				newValue = -90 + knxValue/255 * 180;
			}
			
			this.myAPI.setValue("TargetHorizontalTiltAngle", newValue);

		} else if (field==="CurrentHorizontalTiltAngle") {
			// Current Position is sent by the actuator if the Movement has stopped a new postion is reached
			
			// CurrentPosition is DPT5.001 Percentage (0..255)
			// need to convert to (-90..90) first
			// Homekit is using degrees, meaning
			
			let ninetyDegRotation = this.myAPI.getLocalConstant("ninetyDegRotation");

			// is the Shutter one with a full rotation or one with 90° only?
			if (ninetyDegRotation===true) {		
				newValue = 0 + knxValue/255 * 90;
			} else {
				newValue = -90 + knxValue/255 * 180;
			}
			
			this.myAPI.setValue("CurrentHorizontalTiltAngle", newValue); // inform homekit
			this.myAPI.setValue("TargetHorizontalTiltAngle", newValue);
			
		} //if
	} // onBusValueChange
	
	/*******************************************************************************************************************
	 * onHKValueChange is invoked if HomeKit is changing characteristic values
	 * 
	 */
	onHKValueChange(field, oldValue, newValue) {
		super.onHKValueChange(field, oldValue, newValue);
		// homekit will only send a TargetPosition value, so we do not care about (non-) potential others


		if (field === "TargetPosition") {
			if (newValue === 0){
				this.myAPI.setValue("TargetHorizontalTiltAngle", 90); // set shutters to closed as well
				this.onHKValueChange("TargetHorizontalTiltAngle", 0, 90);
			}

		} else if (field==="TargetHorizontalTiltAngle") {
			//TargetHorizontalTiltAngle
			let knxValue;
			var ninetyDegRotation = this.myAPI.getLocalConstant("ninetyDegRotation");

			// is the Shutter one with a full rotation or one with 90° only?
			if (ninetyDegRotation) {		
				if (newValue > 0){
					knxValue = newValue/90 * 255;
				} else {
					knxValue = 0;
				}
			} else {
				knxValue = (newValue+90)/180 * 255;
			}
			
			console.log('INFO: onHKValueChange after calc ('  + knxValue+ ")");
			this.myAPI.knxWrite("TargetHorizontalTiltAngle", knxValue, "DPT5"); // send the new position to the KNX bus

		}
		
	} // onHKValueChange
} // class	
module.exports=	WindowCoveringTilt;

	
/* **********************************************************************************************************************
 * The config for that should look like: LocalConstants is now used in this sample 
 * Reverse keyword is not allowed for custom handlers
 * 
"Services": [
{
    "ServiceType": "WindowCovering",
    "Handler": "WindowCoveringTilt",
    "ServiceName": "Jalousie Wohnzimmer",
    "Characteristics": [
        {
            "Type": "TargetPosition",
            "Set": [
                "2/1/32"
            ],
            "Listen": [
                "2/1/32"
            ],
            "DPT": "DPT5"
        },
        {
            "Type": "CurrentPosition",
            "Listen": [
                "2/1/33"
            ],
            "DPT": "DPT5"
        },
        {
            "Type": "PositionState"
        },
        {
            "Type": "TargetHorizontalTiltAngle",
            "Set": [
                "2/1/34"
            ],
            "Listen": [
                "2/1/34"
            ],
            "DPT": "DPT5"
        },
        {
            "Type": "CurrentHorizontalTiltAngle",
            "Listen": [
                "2/1/35"
            ],
            "DPT": "DPT5"
        }
    ],
    "KNXObjects": [
        {
            "Type": "ShutterMove",
            "Listen": "2/1/30",
            "DPT": "DPT1"
        }
    ],
    "KNXReadRequests": [
        "2/1/33",
        "2/1/35"
    ],
    "LocalConstants": {
        "ninetyDegRotation": true
    }
}
 * 
 * 
 */
