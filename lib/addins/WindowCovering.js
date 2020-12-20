/* Sample module - Simple handler for rolling shutter actuator  
 * 
 */
/* jshint esversion: 6, strict: true, node: true */
'use strict';

/**
 * @type {HandlerPattern}
 */
var HandlerPattern = require('./handlerpattern.js');
var log = require('debug')('WindowCovering');

/**
 * @class A custom handler for the "Jalousie Aktor" (rolling shutter/blinds actuator) - including Tilt
 * @extends HandlerPattern
 */
class WindowCovering extends HandlerPattern {

	/*******************************************************************************************************************
	 * onKNXValueChange is invoked if a Bus value for one of the bound addresses is received
	 * 
	 */
	onKNXValueChange(field, oldValue, knxValue) {
		// value for HomeKit
		var newValue;

		console.log('INFO: onKNXValueChange(' + field + ", "+ oldValue + ", "+ knxValue+ ")");

		if (field === "TargetPosition") {
			// TargetPosition is DPT5.001 Percentage (0..255)
			// need to convert to (0..100) first
			// Homekit is using %-open, meaning 0% is closed/down
			
			newValue = 100 - knxValue*100 / 255;
			
			if (newValue > this.myAPI.getValue("CurrentPosition") || newValue == 100 ) {
				// newValue is higher, shutter's moving up
				this.myAPI.setValue("PositionState", 1);

			} else if (newValue < this.myAPI.getValue("CurrentPosition") || newValue == 0  ){
				// newValue is higher, shutter's moving down
				this.myAPI.setValue("PositionState", 0);
			}
			
			this.myAPI.setValue("TargetPosition", newValue);

		/*} else if (field === "HoldPosition") {
			// don't need: currentPosition is received
			this.myAPI.setValue("PositionState", 2); //stopped
			// return to stopped immediately, and set the Target to Current
			this.myAPI.setValue("TargetPosition", this.myAPI.getValue("CurrentPosition"));
*/
		} else if (field === "CurrentPosition") {
			// Current Position is sent by the actuator if the Movement has stopped a new postion is reached
			
			// CurrentPosition is DPT5.001 Percentage (0..255)
			// need to convert to (0..100) first
			// Homekit is using %-open, meaning 0% is closed/down
			newValue = 100 - knxValue*100 / 255;
			
			this.myAPI.setValue("CurrentPosition", newValue); // inform homekit
			this.myAPI.setValue("PositionState", 2); //stopped


			// return to stopped immediately, and set the Target to Current
			this.myAPI.setValue("TargetPosition", this.myAPI.getValue("CurrentPosition"));

		} else if (field==="ShutterMove") {
			// this isn't a characteristic, we need this extra object to catch switch use, too
			// The actuator is lowering the rolling shutters if a 1 is received, and 
			// raises on a 0

			switch (knxValue) {
				case 0:
					this.myAPI.setValue("TargetPosition", 100); // top position, so home shows "opening"
					this.myAPI.setValue("PositionState", 1); //up
					break;
				case 1:
					this.myAPI.setValue("TargetPosition", 0); // low position, so home shows "closing"
					this.myAPI.setValue("PositionState", 0); //down
					break;
			} // switch

		}
	} // onBusValueChange
	
	/*******************************************************************************************************************
	 * onHKValueChange is invoked if HomeKit is changing characteristic values
	 * 
	 */
	onHKValueChange(field, oldValue, newValue) {
		// homekit will only send a TargetPosition value, so we do not care about (non-) potential others


		if (field === "TargetPosition") {
			console.log('INFO: onHKValueChange(' + field + ", "+ oldValue + ", "+ newValue + ")");
			// update the PositionState characteristic:		
			// get the last current Position
			var lastPos = this.myAPI.getValue("CurrentPosition");

			if (newValue > lastPos) {
				// newValue is higher, shutter's moving up
				this.myAPI.setValue("PositionState", 1); //up

			} else if (newValue < lastPos){
				// newValue is higher, shutter's moving down
				this.myAPI.setValue("PositionState", 0); //down

			}

			var knxValue = (255 - newValue*255 / 100);
			
			console.log('INFO: onHKValueChange after calc ('  + knxValue+ ")");
			this.myAPI.knxWrite("TargetPosition", knxValue, "DPT5"); // send the new position to the KNX bus

		} else if (field==="HoldPosition") {
			//HoldPosition
			console.log('INFO: onHKValueChange(' + field + ", "+ oldValue + ", "+ newValue + ")");

			let knxValue = 1;
			
			console.log('INFO: onHKValueChange after calc ('  + knxValue+ ")");
			this.myAPI.knxWrite("HoldPosition", knxValue, "DPT1"); // send hold position to the KNX bus

		}
		
	} // onHKValueChange
} // class	
module.exports=	WindowCovering;

	
/* **********************************************************************************************************************
 * The config for that should look like: LocalConstants is now used in this sample 
 * Reverse keyword is not allowed for custom handlers
 * 
"Services": [
{
    "ServiceType": "WindowCovering",
    "Handler": "WindowCovering",
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
    ]
}
 * 
 * 
 */
