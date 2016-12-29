sap.ui.define([
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"cot/util/Controller",
	"cot/dev/devapp"
], function(Fragment, MessageBox, Controller, devapp) {
	"use strict";

	return Controller.extend("cot.controller.App", {
		/**
		 * initializing controller, subscribe two "OfflineStore" channel event
		 */
		onInit: function() {
			var oEventBus = this.getEventBus();
			oEventBus.subscribe("OfflineStore", "Refreshing", this.onRefreshing, this);
			oEventBus.subscribe("OfflineStore", "Synced", this.synFinished, this);
			oEventBus.subscribe("OfflineStore", "OpenErrDialog", this.openErrDialog, this);
			this._sErrorText = this.getResourceBundle().getText("errorText");
		},

		/**
		 * UI5 OfflineStore channel Refreshing event handler, refreshing the offline store data
		 */
		onRefreshing: function() {
			if (devapp.isOnline) {
				this.getView().setBusy(true);
				//ask refreshing store after flush
				devapp.refreshing = true;
				if (devapp.devLogon) {
					devapp.devLogon.flushAppOfflineStore();
				}
			} else {
				this.getView().getModel().refresh();
			}
		},

		/**
		 * UI5 OfflineStore channel Synced event handler, after refreshing offline store, refresh data model
		 */
		synFinished: function() {
			this.getView().getModel().refresh();
			this.getView().setBusy(false);
			var errorNum = devapp.deviceModel.getProperty("/errorNum");
			if (errorNum > 0) {
				if (!this._errDlg) {
					this._errDlg = sap.ui.xmlfragment("errorArchiveDialog", "cot.view.ErrorArchive", this);
					this.getView().addDependent(this._errDlg);
				}
				this._errDlg.open();
			} else if (devapp.devLogon.appOfflineStore.callbackError) {
				MessageBox.alert(JSON.stringify(devapp.devLogon.appOfflineStore.callbackError));
			}
			devapp.devLogon.appOfflineStore.callbackError = null;
		},

		onNavtoErrDetail: function(oEvent) {
			var oCtx = oEvent.getSource().getBindingContext();
			var oNavCon = Fragment.byId("errorArchiveDialog", "errorNav");
			var oDetailPage = Fragment.byId("errorArchiveDialog", "errorDetail");
			oNavCon.to(oDetailPage);
			oDetailPage.bindElement(oCtx.getPath());
		},

		onErrorNavBack: function() {
			var oNavCon = Fragment.byId("errorArchiveDialog", "errorNav");
			oNavCon.back();
		},

		onDelBTVisible: function(errCount) {
			var bShow = false;
			if (errCount > 0) {
				bShow = true;
			}

			return bShow;
		},

		onDeleteErrRecord: function() {
			if (devapp.devLogon.appOfflineStore.errorArchiveRowURL) {
				var model = this.getView().getModel();
				model.remove(devapp.devLogon.appOfflineStore.errorArchiveRowURL, {
					success: function() {
						//clean errorNum
						devapp.deviceModel.setProperty("/errorNum", 0);
						devapp.devLogon.appOfflineStore.errorArchiveRowURL = null;
					},
					error: function(error) {
						MessageBox.alert(JSON.stringify(error));
					}
				});
			}
		},

		openErrDialog: function() {
			if (!this._errDlg) {
				this._errDlg = sap.ui.xmlfragment("errorArchiveDialog", "cot.view.ErrorArchive", this);
				this.getView().addDependent(this._errDlg);
			}
			this._errDlg.open();
		},

		onErrDlgClose: function() {
			this._errDlg.close();
		},

		onFormatTitle: function(requestMethod) {
			var title = "Error";
			if (requestMethod.toLowerCase() === "delete") {
				title = "Warning";
			}
			return title;
		}
	});
});