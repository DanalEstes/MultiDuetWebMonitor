

/* Main interface logic for Multi Duet Web Monitoring and Control
 *
 * written  by Danal Estes (c) 2018
 * inspired by Christian Hammacher's DWC
 *
 * licensed under the terms of the GPL v3
 * see http://www.gnu.org/licenses/gpl-3.0.html
 */

// Truly Global Variables
printers = [];
printers[0] = {name: 'Example Printer', pwd: "", ip: "192.168.1.20", camurl: "http://192.168.1.21/video"}
printersStatus = [];
printersStatus[0] = {connected: false, status: ''}

showTranslationWarning = true;  //  Override the setting in i18n.js, at least for now

var machineName = "Multi Duet Web Monitoring and Control";

var isPrinting, isPaused, printHasFinished;

function resetGuiData() {
	//setBoardType("unknown");
}

$(document).ready(function () {
	$('[data-min]').each(function () {
		$(this).attr("min", $(this).data("min")).attr("step", "any");
	});
	$('[data-max]').each(function () {
		$(this).attr("max", $(this).data("max")).attr("step", "any");
	});
	//$('[data-toggle="popover"]').popover();
	$(".app-control").toggleClass("hidden", typeof app === "undefined");

	//disableControls();
	resetGuiData();
	//updateGui();

	loadSettings();
});


function pageLoadComplete() {
	// Add link to GitHub and log event
	//$("#span_copyright").html($("#span_copyright").html().replace("Christian Hammacher", '<a href="https://github.com/chrishamm/DuetWebControl" target="_blank">Christian Hammacher</a>'));
	//log("info", "<strong>" + T("Page Load complete!") + "</strong>");

	// Users may want to connect automatically once the page has loaded
	//if (settings.autoConnect) {
	//	connect(sessionPassword, true);
	//}

	// Check if this browser is supported and display a message if it is not
	var userAgent = navigator.userAgent.toLowerCase();
	var browserSupported = true;
	browserSupported &= (String.prototype.startsWith != undefined);
	browserSupported &= (userAgent.indexOf("webkit") != -1 || userAgent.indexOf("gecko") != -1);
	if (!browserSupported) {
		showMessage("warning", T("Unsupported browser"), "<strong>" + T("Warning") + ":</strong> " + T("Your browser is not officially supported. To achieve the best experience it is recommended to use either Mozilla Firefox, Google Chrome or Opera."), 0, true);
	}

	// Make sure the loaded JS matches the HTML version
	if (typeof MDWMCVersion != "undefined" && MDWMCVersion != $("#mdwmc_version").text()) {
		showMessage("warning", T("Version mismatch"), "<strong>" + T("Warning") + ":</strong> " + T("The versions of your HTML and JavaScript files do not match. This can lead to unpredictable behavior and other problems. <br><br> FIRST THING TO TRY IS Ctrl+Shift+R."), 0, false);
	}
	rebuildTable();
    pollForActionsInterval = setInterval(pollForActions,1000);

}
/* End of initilization.  Everything from here driven by pollFor Actions */

var cycleCount  = 9;  // Immediately try to connect. 
function pollForActions() {
	cycleCount++;
	for (var i = 0; i < printers.length; i++) {
		if ((0 == cycleCount % 10) && (! printersStatus[i].connected)) {
			connect(printers[i].ip,printers[i].pwd)
		}
		if ((0 == cycleCount % 2 ) && (  printersStatus[i].connected)) {
			updateStatusNew(i);
		} 
	}
}

var statusAlternate = 0;
function updateStatusNew(which) {
	var ajaxPrefix = 'HTTP://'+printers[which].ip+'/';
	var ajaxRequest = "rr_status?type=2";
	if ('P' == printersStatus[which].status) {ajaxRequest = "rr_status?type=" + ((statusAlternate = !statusAlternate) ? 2 : 3)};
	//console.log("Requesting ", ajaxPrefix, ajaxRequest)
	$.ajax(ajaxPrefix + ajaxRequest, {
		dataType: "json",
		success: function (status) {
			// Don't process this one if we're no longer connected
			if ((typeof printersStatus[which] === 'undefined') || (!printersStatus[which].connected)) {
				return;
			}
			if (status.hasOwnProperty("name")) {
				updateRowName(which,status.name);
			}
			if (status.hasOwnProperty("status")) {
				updateRowStatus(which,status.status);
			}
			
			if (status.hasOwnProperty("message")) {
				showMessage("info", T("Message from Duet firmware"), status.message, 30);
			}
			
			// Hard coded temps, for now
			if (status.temps.hasOwnProperty("current") && status.temps.hasOwnProperty("state")) {
				var now    = status.temps.current[1];
				var set = status.temps.tools.active[0][0];
				updateRowTemp(which,now,set);
			}
			
			/* Capture percent printed, if we received it */
			if (status.hasOwnProperty("fractionPrinted") ) {
				var progress = status.fractionPrinted;
				if (progress < 0) {
					progress = 100;
				}
				printersStatus[which].progress = progress;
			}
			/* Plot percent printed, if it is printing */
			if ('P' == printersStatus[which].status) updateRowProgress(which);
			
		} /* Ajax Success */
	});		
}


/* Start of Add A Printer */
$("#b-addprinter").click({
	apply: function (event) {$('#input_host').val(""); $("#modal_host_input").modal("show");}
});

$("#modal_host_input").on("shown.bs.modal", function () {
	$("#input_host").focus();
});

$("#form_host").submit(function (e) {
	$("#modal_host_input").off("hide.bs.modal").modal("hide");
	var ip = $("#input_host").val(); 
	e.preventDefault();
	if (ip == '' ) return;

	var badip = 0;
	/*
	var arrIp = ip.split(".");
    if (arrIp.length !== 4) badip=1;
    for (let oct of arrIp) {
        if ( isNaN(oct) || Number(oct) < 0 || Number(oct) > 255) badip=1;
	}
	if (badip) showMessage("warning","Malformed IP", "Printer IP " + ip + " is not a valid V4 IP address", 5, true);
	*/
	
	printers.forEach(function(printer) {
		if (printer.ip == ip) {
			showMessage("warning",T("Duplicate IP or Hostname"), T("Printer ") + ip + T(" already exists"), 5, true);
			badip=1;
		}
	});

	if (badip) return;
	
	var i=printers.length;
	printers[i]= {name: T("TBD at first status update"), pwd: "", ip: ip, camurl: "Null" };
	printersStatus[i] = {connected: false, status: ''}
	rebuildTable();
	showPasswordPrompt();
});

/*
$("body").on("click", ".btn-connect", function () {
	console.log("In btn-connect")
	if (!$(this).hasClass("disabled")) {
		if (!isConnected) {
			// Attempt to connect with the last-known password first
			//connect(sessionPassword, true);
		} else {
			//disconnect(true);
		}
	}
});
*/

/* Password prompt */

function showPasswordPrompt() {
	$('#input_password').val("");
	$("#modal_pass_input").modal("show");
	$("#modal_pass_input").one("hide.bs.modal", function () {
		// The network request will take a few ms anyway, so no matter if the user has
		// cancelled the password input, we can reset the Connect button here...
		$(".btn-connect").removeClass("btn-warning disabled").addClass("btn-info").find("span:not(.glyphicon)").text(T("Connect"));
	});
}

$("#form_password").submit(function (e) {
	$("#modal_pass_input").off("hide.bs.modal").modal("hide");
	printers[printers.length-1].pwd = $("#input_password").val()
	e.preventDefault();
	saveSettings();
	rebuildTable();
});

$("#modal_pass_input").on("shown.bs.modal", function () {
	$("#input_password").focus();
});


/* Start of Delete A Printer */
$("#b-delprinter").click({ 
	apply: function (event) {
		$("#input_del_drop").empty();
		if (0 == printers.length) return
		for (i = 0; i < printers.length; i++) { 
			$("<option />")
				.attr("value", printers[i].ip)
				.html(printers[i].name + ' - ' + printers[i].ip)
				.appendTo($("#input_del_drop"));
		}
		$("#modal_host_del_input").modal("show");
	}
});

$("#modal_host_del_input").on("shown.bs.modal", function () {
	$("#input_del_host").focus();
});

$("#form_del_host").submit(function (e) {
	$("#modal_host_del_input").off("hide.bs.modal").modal("hide");
	var obj = document.getElementById("input_del_drop");
	ip= obj.selectedOptions[0].value;
	e.preventDefault();
	for (var i = 0; i < printers.length; i++) { 
		if (printers[i].ip == ip) {
			printers.splice(i,1);
			printersStatus.splice(i,1);
			break;
		}
	}
	saveSettings();
	rebuildTable();
});


/* Disconnect all and close browser (or tab) */
$("#b-discstop").click({
	apply: function (event) {disconnectAllAndStop();}
});

function disconnectAllAndStop() {
	clearInterval(pollForActionsInterval);  // Stop
	for (i = 0; i < printers.length; i++) { 
		if (printersStatus[i].connected) disconnect(printers[i].ip);
		}
	$("#modal_stop").modal("show")
	window.stop();
}

window.onunload = function() {disconnectAllAndStop();}


function setBoardType(type,ip) {
	boardType = type;

	var isWiFi,
	isDuetNG;
	if (type.indexOf("duetwifi") == 0) {
		firmwareFileName = "DuetWiFiFirmware";
		isWiFi = isDuetNG = true;
	} else if (type.indexOf("duetethernet") == 0) {
		firmwareFileName = "DuetEthernetFirmware";
		isWiFi = false;
		isDuetNG = true;
	} else {
		firmwareFileName = "RepRapFirmware";
		isWiFi = isDuetNG = false;
	}
	$(".duet-ng").toggleClass("hidden", !isDuetNG);
	$(".wifi-setting").toggleClass("hidden", !isWiFi);
}

function rebuildTable() {
//printers[0] = {name: 'Example Printer', pwd: "", ip: "192.168.1.20", camurl: "http://192.168.1.21/video"}
	var table = document.getElementById('table_of_printers');

	for (var i = table.rows.length-1; i > 0; i--) {table.rows[i].remove()}

	printers.forEach(function(printer) {
		var row= table.insertRow(-1);
		row.insertCell().innerHTML = printer.name+'<br><a href="http://'+printer.ip+'" target="_blank">'+printer.ip+'</a>';
		row.insertCell().innerHTML = 'Unknown; automatic update pending.';
		row.insertCell().innerHTML = '<input type="button" class="btn btn-success" value="' + T("Connect") + '"' +
			' onclick="connect(\''+printer.ip+'\',\''+printer.pwd+'\')" />';
		row.insertCell().innerHTML = '<button class="btn btn-success btn-sm" onclick="upRow(\''+printer.ip+'\')" >^</button>';
		row.style.backgroundColor = "#DDDDDD";
	});	
	
	table.rows[1].cells[3].innerHTML='';
	
	for (var i = 0, row; row = table.rows[i]; i++) {
		row.style.borderColor = '#0d9afc'
		row.cells[0].style.width = "20%";
		row.cells[1].style.width = "50%";
		row.cells[2].style.width = "30%";
		row.cells[3].style.width = "2%";
		row.cells[0].style.borderColor = '#0d9afc';
		row.cells[1].style.borderColor = '#0d9afc';
		row.cells[2].style.borderColor = '#0d9afc';
		row.cells[3].style.borderColor = '#0d9afc';
		row.cells[0].style.borderWidth = '2px';
		row.cells[1].style.borderWidth = '2px';;
		row.cells[2].style.borderWidth = '2px';;
		row.cells[3].style.borderWidth = '2px';;
	}

    return;		
	
}

function updateRowConnected(ip) {
	var table = document.getElementById('table_of_printers');
	for (var i = 1, row; row = table.rows[i]; i++) {
		if (row.cells[0].innerText.includes(ip)) {
			printersStatus[i-1] = {connected: true, status: ''}
			row.style.backgroundColor = "#DDFFDD";
			row.cells[1].innerHTML = 'Connected; status update pending';
			row.cells[2].innerHTML = '';
		}
	}

}

function updateRowConnectFail(ip) {
	var table = document.getElementById('table_of_printers');
	for (var i = 1, row; row = table.rows[i]; i++) {
		if (row.cells[0].innerText.includes(ip)) {
			printersStatus[i-1] = {connected: false, status: ''}
			row.style.backgroundColor = "#FFAAAA";
			row.cells[1].innerHTML = 'Connect failed<br>Most recent attempt '+(new Date()).toLocaleTimeString();
			row.cells[2].innerHTML = '<input type="button" class="btn btn-success" value="' + T("Connect") + '"' +
									 ' onclick="connect(\''+printers[i-1].ip+'\',\''+printers[i-1].pwd+'\')" />';

		}
	}
}

function updateRowDisconnected(ip) {
	var table = document.getElementById('table_of_printers');
	for (var i = 1, row; row = table.rows[i]; i++) {
		if (row.cells[0].innerText.includes(ip)) {
			printersStatus[i-1] = {connected: false, status: ''}
			row.cells[0].innerHTML = printers[i-1].name+'<br><a href="http://'+printers[i-1].ip+'" target="_blank">'+printers[i-1].ip+'</a>';
			row.cells[1].innerHTML = T('Disconnected.');
			row.cells[2].innerHTML = '<input type="button" class="btn btn-success" value="' + T("Connect") + '"' +
				' onclick="connect(\''+printers[i-1].ip+'\',\''+printers[i-1].pwd+'\')" />';
			row.style.backgroundColor = "#DDDDDD";
		}
	}
}

function updateRowName(which,name) {
	if  (printers[which].name !== name) {
		printers[which].name = name;
		saveSettings()
		var table = document.getElementById('table_of_printers');
		row = table.rows[which+1];
		row.cells[0].innerHTML = name+'<br><a href="http://'+printers[which].ip+'" target="_blank">'+printers[which].ip+'</a>';
	}
}

function updateRowStatus(which,status) {

	var table = document.getElementById('table_of_printers');
	row = table.rows[which+1];
	row.classList.remove("row-flash-red");

	printersStatus[which].status = status;
	
	switch (status) {
	case 'F': // Flashing new firmware
	    row.cells[1].innerText = "Flashing Firmware"
		row.style.backgroundColor = "#AAAAFF";
		break;

	case 'H': // Halted
	    row.cells[1].innerText = "Halted"
		break;

	case 'D': // Pausing / Decelerating
		break;

	case 'S': // Paused / Stopped
		var fn = 'Paused<br>'
		if (typeof(printersStatus[which].fileinfo) !== 'undefined') {
			fn = 'Paused, file name: "<strong>' + printersStatus[which].fileinfo.fileName + '</strong>", ';
	        settings.useKiB = 1;
			fn = fn + formatSize(printersStatus[which].fileinfo.size) + '<br>';
		}	
	    row.cells[1].innerHTML = fn
		row.cells[2].innerHTML = '<input type="button" class="btn btn-danger" id="b-home" value="' + T("Disconnect") + '"' +
											 ' onclick="disconnect(\''+printers[which].ip+'\')" />' +
								 '<input type="button" class="btn btn-success" id="b-home" value="Resume" ' +
									' onclick="sendGCode(\''+printers[which].ip+'\',\'M24\')" />';
								 //'<input type="button" class="btn btn-default" id="b-home" value="Open Camera" />';
		row.classList.add("row-flash-red");
		break;

	case 'R': // Resuming
	    row.cells[1].innerText = "Resuming"
		break;

	case 'P': // Printing
		var fn = 'Printing'
		if (typeof(printersStatus[which].fileinfo) !== 'undefined') {
			fn = 'Printing, file name: "<strong>' + printersStatus[which].fileinfo.fileName + '</strong>", ';
	        settings.useKiB = 1;
			fn = fn + formatSize(printersStatus[which].fileinfo.size);
		}
	    row.cells[1].innerHTML = fn +  
								 '<div class="progress" style="margin-bottom:0;">' +
									'<div class="progress-bar progress-bar-striped" id="progress'+printers[which].ip+'";">' +
									'</div>' +
								 '</div>';
		row.cells[2].innerHTML = '<input type="button" class="btn btn-danger" id="b-home" value="' + T("Disconnect") + '"' +
											 ' onclick="disconnect(\''+printers[which].ip+'\')" />' +
								 '<input type="button" class="btn btn-warning" id="b-home" value="Pause Print" ' +
									' onclick="sendGCode(\''+printers[which].ip+'\',\'M25\')" />' ;	
								// '<input type="button" class="btn btn-default" id="b-home" value="Open Camera" />';
		row.style.backgroundColor = "#E0FFE0";
		requestFileInfo(which);
		break;

	case 'M': // Simulating
		var fn = 'Simulating'
		if (typeof(printersStatus[which].fileinfo) !== 'undefined') {
			fn = 'Simulating, file name: ' + printersStatus[which].fileinfo.fileName + ', ';
	        settings.useKiB = 1;
			fn = fn + formatSize(printersStatus[which].fileinfo.size);
		}
	    row.cells[1].innerHTML = fn +  
								 '<div class="progress" style="margin-bottom:0;">' +
									'<div class="progress-bar progress-bar-striped" id="progress'+printers[which].ip+'";">' +
									'</div>' +
								 '</div>';
		row.cells[2].innerHTML = '<input type="button" class="btn btn-danger" id="b-home" value="' + T("Disconnect") + '"' +
											 ' onclick="disconnect(\''+printers[which].ip+'\')" />' +
								 '<input type="button" class="btn btn-warning" id="b-home" value="Pause Sim" ' +
									' onclick="sendGCode(\''+printers[which].ip+'\',\'M25\')" />'; 	
								 //'<input type="button" class="btn btn-default" id="b-home" value="Open Camera" />';
		row.style.backgroundColor = "#E0FFE0";
		break;

	case 'B': // Busy
	    row.cells[1].innerText = "Busy"
		break;

	case 'T': // Changing tool
	    row.cells[1].innerText = "Changing Tool"
		break;

	case 'I': // Idle
	    row.cells[1].innerHTML = "Idle<br>"
		row.cells[2].innerHTML = '<input type="button" class="btn btn-danger" id="b-home" value="' + T("Disconnect") + '"' +
											 ' onclick="disconnect(\''+printers[which].ip+'\')" />' +
								 //'<input type="button" class="btn btn-default" id="b-home" value="Print File" />' +
								 //'<input type="button" class="btn btn-default" id="b-home" value="Open Camera" /><br>' +
								 '<input type="button" class="btn btn-success" id="b-home" value="Home All" ' +
									' onclick="sendGCode(\''+printers[which].ip+'\',\'G28\')" />';
		row.style.backgroundColor = "#FFFFE0";
		break;
	default:
	    row.cells[1].innerText = "Unknown Status " + status;
		row.style.backgroundColor = "#FF0000";
		row.style.color = "#FFFFFF";

	
	}
}

function updateRowTemp(which,now,set) {
	var table = document.getElementById('table_of_printers');
	var row = table.rows[which+1];
	var now = T("{0} °C", now.toFixed(1));
	var set = T("{0} °C", set.toFixed(1));
	/* Since we are called after status replaces cell 1, we can always append */

	row.cells[1].innerHTML = row.cells[1].innerHTML + 'Extruder: ' + now + '/'+ set;
	
}

function updateRowProgress(which,progress) {
	var progress = printersStatus[which].progress;
	if (!progress > 0) return;
	document.getElementById("progress"+printers[which].ip).style.width = progress.toFixed(0) + "%";
	document.getElementById("progress"+printers[which].ip).innerText = T("{0}% Complete", progress);
}

function upRow(ip) {
	var which = 0;
	var table = document.getElementById('table_of_printers');
	for (var i = 1, row; row = table.rows[i]; i++) {
		if (row.cells[0].innerText.includes(ip)) {
			which = i;
			break;
		}
	}
	
	which--; // Change table offset to array offset. 

	if (which > 0) {
		tmp=printers[which-1]
		printers[which-1]=printers[which];
		printers[which]=tmp;

		tmp=printersStatus[which-1]
		printersStatus[which-1]=printersStatus[which];
		printersStatus[which]=tmp;

		rebuildTable();
		saveSettings();
	}
}