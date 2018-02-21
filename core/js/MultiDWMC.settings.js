
/* Settings management for Duet Web Control
 *
 * written by Christian Hammacher (c) 2016-2017
 * modified by Danal Estes for Multi (c) 2018
 *
 * licensed under the terms of the GPL v3
 * see http://www.gnu.org/licenses/gpl-3.0.html
 */

var settings = {
		maxRetries: 1,					// number of AJAX retries before the connection is terminated


};

var defaultSettings = jQuery.extend(true, {}, settings); // need to do this to get a valid copy

var themeInclude;

/* Setting methods */

function loadSettings() {
	
	
	// Try to parse the stored settings (if any)
	if (localStorage.getItem("settings") != null) {
		var loadedSettings = localStorage.getItem("settings");
		if (loadedSettings != undefined && loadedSettings.length > 0) {
			loadedSettings = JSON.parse(loadedSettings);

			for (var key in settings) {
				// Try to copy each setting if their types are equal
				if (loadedSettings.hasOwnProperty(key) && settings[key].constructor === loadedSettings[key].constructor) {
					settings[key] = loadedSettings[key];
				}
			}
		}
		if (loadedSettings['printers'] != null) {
			printers = loadedSettings['printers'];
			for (var i = 0; i < printers.length; i++) {
				printersStatus[i] = {connected: false, status: ''}
			}
		}
	}

	// Apply them
	applySettings();

	// Try to load the translation data
	$.ajax("language.xml", {
		type: "GET",
		dataType: "xml",
		global: false,
		error: function () {
			pageLoadComplete();
		},
		success: function (response) {
			translationData = response;

			if (translationData.children == undefined) {
				// Internet Explorer and Edge cannot deal with XML files in the way we want.
				// Disable translations for those browsers.
				translationData = undefined;
				$("#dropdown_language, #label_language").addClass("hidden");
			} else {
				$("#dropdown_language ul > li:not(:first-child)").remove();
				for (var i = 0; i < translationData.children[0].children.length; i++) {
					var id = translationData.children[0].children[i].tagName;
					var name = translationData.children[0].children[i].attributes["name"].value;
					$("#dropdown_language ul").append('<li><a data-language="' + id + '" href="#">' + name + '</a></li>');
					if (settings.language == id) {
						$("#btn_language > span:first-child").text(name);
					}
				}
				translatePage();
			}
			pageLoadComplete();
		}
	});
}

function applySettings() {
	/* Apply settings */

	// Set AJAX timeout
	$.ajaxSetup({
		timeout: sessionTimeout / (settings.maxRetries + 1)
	});

	// Language is set in XML AJAX handler
}

function saveSettings() {
	// Get input values
    settings['printers'] = printers;

	// Save language
	if (settings.language != $("#btn_language").data("language")) {
		showMessage("success", T("Language has changed"), T("You have changed the current language. Please reload the web interface to apply this change."), 0);
	}
	settings.language = $("#btn_language").data("language");

	// Save Settings
	localStorage.setItem("settings", JSON.stringify(settings));
}

function constrainSetting(value, defaultValue, minValue, maxValue) {
	if (isNaN(value)) {
		return defaultValue;
	}
	if (value < minValue) {
		return minValue;
	}
	if (value > maxValue) {
		return maxValue;
	}

	return value;
}
