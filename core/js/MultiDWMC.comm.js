/* Communication routines between RepRapFirmware and Duet Web Control
 *
 * written by Christian Hammacher (c) 2016-2017
 * modified for Multi by Danal Estes (c) 2018
 *
 * licensed under the terms of the GPL v3
 * see http://www.gnu.org/licenses/gpl-3.0.html
 */

var sessionTimeout = 8000;				// Time in ms before RepRapFirmware kills our session
var ajaxRequests = [];					// List of all outstanding AJAX requests


/* AJAX Events */

$(document).ajaxSend(function (event, jqxhr, settings) {
	ajaxRequests.push(jqxhr);
});

$(document).ajaxComplete(function (event, jqxhr, settings) {
	ajaxRequests = $.grep(ajaxRequests, function (item) {
			item != jqxhr;
		});
});

$(document).ajaxError(function (event, jqxhr, xhrsettings, thrownError) {
	if (thrownError == "abort") {
		// Ignore this error if this request was cancelled intentionally
		return;
	}
	console.log(event,thrownError);

});


/* Connect / Disconnect */


function connect(ip, password) {
	ajaxPrefix = 'HTTP://'+ip+'/';
	console.log("Connection attempt ", ajaxPrefix)

	$.ajax(ajaxPrefix + "rr_connect?password=" + password + "&time=" + encodeURIComponent(timeToStr(new Date())), {
		dataType: "json",
		error: function (response) {
			console.log("Connection Fail ",response.statusText)
			//showMessage("danger", T("Error"), T("Could not establish a connection to the Duet "+ip+" firmware! Please check your settings and try again.") , 30);
			updateRowConnectFail(ip);
		},
		success: function (response) {
			console.log("Connection OK ", response)
			if (response.err == 2) { // Looks like the firmware ran out of HTTP sessions
				showMessage("danger", T("Error"), T("Could not connect to Duet "+ip+", because there are no more HTTP sessions available."), 30);
			} else if (response.err == 0) {
					postConnect(response,ip);
				} else {
					showMessage("danger", T("Error"), T("Invalid password!"), 0);
				}
			}
	});
}

function postConnect(response,ip) {
	if (response.hasOwnProperty("sessionTimeout")) {
		sessionTimeout = response.sessionTimeout;
		$.ajaxSetup({
			timeout: sessionTimeout / (settings.maxRetries + 1)
		});
	}
	if (response.hasOwnProperty("boardType")) {
		setBoardType(response.boardType,ip);
	}
	showMessage("success", T("Connected"), T("Connected to Duet "+ip+". Starting automatic status tracking"), 40);
	updateRowConnected(ip);
	//log("success", "<strong>" + T("Connection established!") + "</strong>");
}


function disconnect(ip) {
	ajaxPrefix = 'HTTP://'+ip+'/';
	console.warn("Disconnecting ",ajaxPrefix);
		$.ajax(ajaxPrefix + "rr_disconnect", {
			dataType: "json",
			global: false
		});
	updateRowDisconnected(ip)
}

function requestFileInfo(which) {
	ajaxPrefix = 'HTTP://'+printers[which].ip+'/';
	$.ajax(ajaxPrefix + "rr_fileinfo", {
		dataType: "json",
		success: function (response) {
			if (response.err == 2) {
				// The firmware is still busy parsing the file, so try again until it's ready
				setTimeout(function () {
						requestFileInfo();
				}, 250);
			} else if (response.err == 0) {
				// File info is valid, use it
				printersStatus[which].fileinfo = response;
			}
		}
	});
}



// Send G-Code directly to the firmware
function sendGCode(ip, gcode) {
	if (gcode == "") {
		return;
	}

	// Although rr_gcode gives us a JSON response, it doesn't provide any useful values for DWC.
	// We only need to worry about an AJAX error event, which is handled by the global AJAX error callback.
	var ajaxPrefix = 'HTTP://'+ip+'/';
	$.ajax(ajaxPrefix + "rr_gcode?gcode=" + encodeURIComponent(gcode), {
		dataType: "json"
	});
}

