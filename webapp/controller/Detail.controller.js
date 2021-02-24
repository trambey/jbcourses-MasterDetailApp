/*global location */
sap.ui.define([
	"jbcourses/MasterDetailApp/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"jbcourses/MasterDetailApp/model/formatter",
	"sap/ui/comp/smarttable/SmartTable",
	"sap/ui/comp/smartfilterbar/SmartFilterBar",
	"sap/m/OverflowToolbar",
	"sap/m/ToolbarSpacer",
	"sap/m/OverflowToolbarButton",
	"sap/m/OverflowToolbarToggleButton",
	"sap/m/ObjectStatus",
	"sap/m/Button",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment"
], function(BaseController, JSONModel, formatter, SmartTable, SmartFilterBar, OverflowToolbar, ToolbarSpacer,
	OverflowToolbarButton,
	OverflowToolbarToggleButton, ObjectStatus, Button, Filter, FilterOperator, MessageBox, MessageToast, Fragment) {
	"use strict";

	return BaseController.extend("jbcourses.MasterDetailApp.controller.Detail", {

		formatter: formatter,

		_mFilters: {
			activeVersion: new Filter("Version", FilterOperator.NE, "D"),
			deactiveVersion: new Filter("Version", FilterOperator.EQ, "D")
		},

		_oViewModel: new JSONModel({
			button: {
				visible: {
					Create: true,
					Update: true,
					DeactivateDelete: true,
					Restore: true,
					Refresh: true,
					Copy: true,
					ChangeSelectionMode: true,
					ChangeVersionMode: true
				},
				pressed: {
					ChangeSelectionMode: false,
					ChangeVersionMode: false
				}
			},
			table: {
				selectionMode: "Single",
				selectedItemsCount: 0
			}
		}),

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			// var oViewModel = new JSONModel({
			// 	busy: false,
			// 	delay: 0
			// });

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(this._oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function() {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		onPressOnChangeSelectionMode: function(oEvent) {
			this.getModel("detailView").setProperty("/table/selectionMode", oEvent.getParameter("pressed") ? "Multi" : "Single");
		},

		onSelectionChange: function() {
			this.getModel("detailView").setProperty("/table/selectedItemsCount", this._oTable.getSelectedIndices().length);
		},

		onPressDeactivateDelete: function(oEvent) {
			let aSelectedContexts = this._oTable.getSelectedIndices()
				.map(iSelectedIndex => this._oTable.getContextByIndex(iSelectedIndex));
			if (this.getModel("detailView").getProperty("button/pressed/ChangeVersionMode")) {
				MessageBox.confirm(this.getResourceBundle().getText("msgDelete"), {
					onClose: oAction => {
						if (oAction === MessageBox.Action.OK) {
							aSelectedContexts.forEach(oContext => {
								this.getModel().remove(oContext.getPath(), {
									success: () => {
										MessageToast.show("msgSuccessDelete");
									}
								});
							});
						}
					}
				});
			} else {
				MessageBox.confirm(this.getResourceBundle().getText("msgDeactivate"), {
					onClose: oAction => {
						if (oAction === MessageBox.Action.OK) {
							aSelectedContexts.forEach(oContext => {
								this.getModel().setProperty(oContext.getPath() + "/Version", "D");
							});
							this.getModel().submitChanges({
								success: () => {
									MessageToast.show("msgSuccessDeactivate");
								}
							});
						}
					}
				});
			}
		},

		onPressRestore: function(oEvent) {
			let aSelectedContexts = this._oTable.getSelectedIndices()
				.map(iSelectedIndex => this._oTable.getContextByIndex(iSelectedIndex));
			MessageBox.confirm(this.getResourceBundle().getText("msgRestore"), {
				onClose: oAction => {
					if (oAction === MessageBox.Action.OK) {
						aSelectedContexts.forEach(oContext => {
							this.getModel().setProperty(oContext.getPath() + "/Version", "A");
						});
						this.getModel().submitChanges({
							success: () => {
								MessageToast.show("msgSuccessRestore");
							}
						});
					}
				}
			});
		},

		onChangeVersionMode: function() {
			this._oSmartTable.rebindTable();
		},

		onPressRefresh: function() {
			this._oSmartTable.rebindTable(true);
			MessageToast.show(this.getResourceBundle().getText("msgRefreshTable"));
		},

		onPressCreate: function() {
			sap.ui.core.Fragment.load({
					name: "jbcourses.MasterDetailApp.view.CreateGroup",
					controller: this
				})
				.then(oDialog => {
					// oDialog.getBeginButton().attachPress(this.onPressLogin.bind(this, oDialog, oEntity, resolve));
					// oDialog.getEndButton().attachPress(this.onPressCancelLogin.bind(this, oDialog, resolve));
					this.getView().addDependent(oDialog);
					oDialog.setModel(this.getModel());
					oDialog.bindObject(this._oTable.getContextByIndex(this._oTable.getSelectedIndices()[0]).getPath());
					oDialog.open();
					this._oDialog = oDialog;
				});
		},
		
		onPressOKCreate: function(oEvent) {
			this.getModel().submitChanges();
			this._oDialog.destroy();
			this._oDialog = null;
		},
		
		onPressCancel: function(oEvent) {
			this._oDialog.destroy();
			this._oDialog = null;
		},    

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sEntity = oEvent.getParameter("arguments").entity;
			this.getModel().metadataLoaded().then(function() {
				this.byId("thDetail").setText(this.getModel("i18n").getResourceBundle().getText("t" + sEntity));
				this._loadTable(sEntity);
			}.bind(this));
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */

		_loadTable: function(sEntity) {

			this._oSmartFilterBar = new SmartFilterBar({
				id: "sf" + sEntity,
				entitySet: "zjblessons_base_" + sEntity,
				liveMode: true,
				enableBasicSearch: false,
				useToolbar: true
			});

			var aToolbarElements = [
				new OverflowToolbarToggleButton({
					text: "{i18n>ttChangeSelectionMode}",
					tooltip: "{i18n>ttChangeSelectionMode}",
					type: "Default",
					icon: "{i18n>iChangeSelectionMode}",
					visible: "{detailView>/button/visible/ChangeSelectionMode}",
					pressed: "{detailView>/button/pressed/ChangeSelectionMode}",
					press: this.onPressOnChangeSelectionMode.bind(this)
				}),
				new Button({
					text: "{i18n>infSelectedItems} {detailView>/table/selectedItemsCount}",
					tooltip: "{i18n>ttResetSelections}",
					type: "Default",
					//press: this.catalog.onResetSelections.bind(this),
					enabled: true,
					visible: "{= ( (${detailView>/table/selectedItemsCount} > 0) && (${detailView>/table/selectionMode} === 'MultiToggle' ) ) }",
					iconFirst: false
				}),
				new OverflowToolbarToggleButton({
					text: "{i18n>ttDeactivateMode}",
					tooltip: "{i18n>ttDeactivateMode}",
					type: "Default",
					icon: "{i18n>iDeactivateMode}",
					visible: "{detailView>/button/visible/ChangeVersionMode}",
					pressed: "{detailView>/button/pressed/ChangeVersionMode}",
					press: this.onChangeVersionMode.bind(this)
				}),
				new ObjectStatus({
					text: "{i18n>infDeactivatedModeOn}",
					inverted: true,
					state: "Warning",
					visible: "{detailView>/button/pressed/ChangeVersionMode}"
				}),
				new ToolbarSpacer(),
				new OverflowToolbarButton({
					//id: "btnCreate",
					icon: "{i18n>iCreate}",
					type: "Default",
					tooltip: "{i18n>ttCreate}",
					text: "{i18n>ttCreate}",
					//press: this.catalog.onCreate.bind(this),
					visible: "{detailView>/button/visible/Create}",
					enabled: "{= !${detailView>/button/pressed/ChangeVersionMode} }",
					press: this.onPressCreate.bind(this)
				}),
				new OverflowToolbarButton({
					//id: "btnCopy",
					icon: "{i18n>iCopy}",
					type: "Default",
					tooltip: "{i18n>ttCopy}",
					text: "{i18n>ttCopy}",
					//press: this.catalog.onCopy.bind(this),
					visible: "{detailView>/button/visible/Copy}",
					enabled: "{= (${detailView>/table/selectedItemsCount} === 1) && !${detailView>/button/pressed/ChangeVersionMode} }"
				}),
				new OverflowToolbarButton({
					//id: "btnRefresh",
					icon: "{i18n>iRefresh}",
					type: "Default",
					tooltip: "{i18n>ttRefresh}",
					//press: this.catalog.onRefresh.bind(this),
					text: "{i18n>ttRefresh}",
					visible: "{detailView>/button/visible/Refresh}",
					press: this.onPressRefresh.bind(this)
				}),
				new OverflowToolbarButton({
					//id: "btnDeactivateDelete",
					text: "{= (${detailView>/button/pressed/ChangeVersionMode}) ? ${i18n>ttDelete} : ${i18n>ttDeactivate}}",
					tooltip: "{= (${detailView>/button/pressed/ChangeVersionMode}) ? ${i18n>ttDelete} : ${i18n>ttDeactivate}}",
					icon: "{= (${detailView>/button/pressed/ChangeVersionMode}) ? ${i18n>iDelete} : ${i18n>iDeactivate}}",
					visible: "{detailView>/button/visible/DeactivateDelete}",
					type: "Default",
					//press: this.catalog.onDeactivateDelete.bind(this),
					enabled: "{= ${detailView>/table/selectedItemsCount} > 0 }",
					press: this.onPressDeactivateDelete.bind(this)
				}),
				new OverflowToolbarButton({
					//id: "btnRestore",
					icon: "{i18n>iRestore}",
					type: "Default",
					tooltip: "{i18n>ttRestore}",
					text: "{i18n>ttRestore}",
					//press: this.catalog.onRestore.bind(this),
					visible: "{detailView>/button/visible/Restore}",
					enabled: "{= ${detailView>/table/selectedItemsCount} > 0 && ${detailView>/button/pressed/ChangeVersionMode}}",
					press: this.onPressRestore.bind(this)
				})

			];

			this._oSmartTable = new SmartTable({
				entitySet: "zjblessons_base_" + sEntity,
				editable: false,
				smartFilterId: "sf" + sEntity,
				tableType: "Table",
				useExportToExcel: true,
				editTogglable: false,
				useVariantManagement: false,
				useTablePersonalisation: true,
				showVariantManagement: true,
				header: " ",
				showRowCount: true,
				enableAutoBinding: true,
				showFullScreenButton: true,
				visible: true,
				beforeRebindTable: this._onBeforeRebindTable.bind(this),
				customToolbar: new OverflowToolbar({
					design: "Transparent",
					content: aToolbarElements
				})
			});

			this._oTable = this._oSmartTable.getTable();

			this._oTable.bindProperty("selectionMode", {
				path: "detailView>/table/selectionMode"
			});
			this._oTable.setSelectionBehavior("Row");
			this._oTable.attachRowSelectionChange(this.onSelectionChange.bind(this));

			this.getModel("detailView").setProperty("/table/selectedItemsCount", 0);
			this.getModel("detailView").setProperty("/table/selectionMode", "Single");
			this.getModel("detailView").setProperty("/button/pressed/ChangeSelectionMode", false);
			this.getModel("detailView").setProperty("/button/pressed/ChangeVersionMode", false);

			//this._oSmartTable.setCustomToolbar();

			// aToolbarElements.forEach(function(oElement) {
			// 	oToolbar.addContent(oElement);
			// });

			var oRowActionTemplate = new sap.ui.table.RowAction({
				items: [
					new sap.ui.table.RowActionItem({
						icon: "{i18n>iEdit}",
						type: "Custom",
						text: "{i18n>ttEdit}",
						//press: this._onUpdate.bind(this),
						visible: "{= ${detailView>/button/visible/Update} && !${detailView>/button/pressed/ChangeVersionMode} }"
					})
				]
			});

			this._oTable.setRowActionTemplate(oRowActionTemplate);
			this._oTable.setRowActionCount(1);

			this.getView().byId("page").setContent(this._oSmartTable);

			this.getView().byId("page").destroyHeaderContent();
			this.getView().byId("page").addHeaderContent(this._oSmartFilterBar);
		},

		_onBeforeRebindTable: function(oEvent) {
			if (oEvent) {
				var sFilterKey = this.getModel("detailView").getProperty("/button/pressed/ChangeVersionMode") ? "deactiveVersion" :
					"activeVersion",
					oFilter = this._mFilters[sFilterKey];
				oEvent.getParameter("bindingParams").filters.push(oFilter);
			}
		},

		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		}

	});

});