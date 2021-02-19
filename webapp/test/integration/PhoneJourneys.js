/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

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
		"jbcourses/MasterDetailApp/test/integration/NavigationJourneyPhone",
		"jbcourses/MasterDetailApp/test/integration/NotFoundJourneyPhone",
		"jbcourses/MasterDetailApp/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});