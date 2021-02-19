/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 zjblessons_base_Materials in the list

sap.ui.require([
	"sap/ui/test/Opa5",
	"jbcourses/MasterDetailApp/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"jbcourses/MasterDetailApp/test/integration/pages/App",
	"jbcourses/MasterDetailApp/test/integration/pages/Browser",
	"jbcourses/MasterDetailApp/test/integration/pages/Master",
	"jbcourses/MasterDetailApp/test/integration/pages/Detail",
	"jbcourses/MasterDetailApp/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "jbcourses.MasterDetailApp.view."
	});

	sap.ui.require([
		"jbcourses/MasterDetailApp/test/integration/MasterJourney",
		"jbcourses/MasterDetailApp/test/integration/NavigationJourney",
		"jbcourses/MasterDetailApp/test/integration/NotFoundJourney",
		"jbcourses/MasterDetailApp/test/integration/BusyJourney"
	], function () {
		QUnit.start();
	});
});