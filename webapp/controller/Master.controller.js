sap.ui.define([
	"sap/ui/Device",
	"cot/util/Controller",
	"cot/dev/devapp"
], function(Device, Controller, devapp) {
	"use strict";

	return Controller.extend("cot.controller.Master", {
		/**
		 * Called when the master list controller is instantiated. 
		 * It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 */
		onInit: function() {
			this.oInitialLoadFinishedDeferred = jQuery.Deferred();
			var oEventBus = this.getEventBus();

			this.getView().byId("list").attachEventOnce("updateFinished", function() {
				this.oInitialLoadFinishedDeferred.resolve();
				oEventBus.publish("Master", "InitialLoadFinished", {
					oListItem: this.getView().byId("list").getItems()[0]
				});
			}, this);

			oEventBus.subscribe("Detail", "TabChanged", this.onDetailTabChanged, this);

			//on phones, we will not have to select anything in the list so we don't need to attach to events
			if (Device.system.phone) {
				return;
			}

			this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);

			oEventBus.subscribe("Detail", "Changed", this.onDetailChanged, this);
			oEventBus.subscribe("Detail", "NotFound", this.onNotFound, this);
			oEventBus.subscribe("Detail", "Cancelled", this.onDetailChangeCancelled, this);
		},

		/**
		 * Master view RoutePatternMatched event handler 
		 * @param{sap.ui.base.Event} oEvent router pattern matched event object
		 */
		onRouteMatched: function(oEvent) {
			var sName = oEvent.getParameter("name");

			if (sName !== "main") {
				return;
			}

			//Load the detail view in desktop
			this.getRouter().myNavToWithoutHash({
				currentView: this.getView(),
				targetViewName: "cot.view.Detail",
				targetViewType: "XML"
			});

			//Wait for the list to be loaded once
			this.waitForInitialListLoading(function() {

				//On the empty hash select the first item
				this.selectFirstItem();

			});

		},

		/**
		 * Detail changed event handler, set selected item
		 * @param{String} sChanel event channel name
		 * @param{String}} sEvent event name
		 * @param{Object}} oData event data object
		 */
		onDetailChanged: function(sChanel, sEvent, oData) {
			var sProductPath = oData.sProductPath;
			//Wait for the list to be loaded once
			this.waitForInitialListLoading(function() {
				var oList = this.getView().byId("list");

				var oSelectedItem = oList.getSelectedItem();
				// the correct item is already selected
				if (oSelectedItem && oSelectedItem.getBindingContext().getPath() === sProductPath) {
					return;
				}

				var aItems = oList.getItems();

				for (var i = 0; i < aItems.length; i++) {
					if (aItems[i].getBindingContext().getPath() === sProductPath) {
						oList.setSelectedItem(aItems[i], true);
						break;
					}
				}
			});
		},

		/**
		 * Detail TabChanged event handler
		 * @param{String} sChanel event channel name
		 * @param{String}} sEvent event name
		 * @param{Object}} oData event data object
		 */
		onDetailTabChanged: function(sChanel, sEvent, oData) {
			this.sTab = oData.sTabKey;
		},

		/**
		 * Detail cancel event handler, reset selected item and show detail view
		 * @param{String} sChanel event channel name
		 * @param{String}} sEvent event name
		 * @param{Object}} oData event data object
		 */
		onDetailChangeCancelled: function() {
			var list = this.getView().byId("list");
			var listItems = list.getItems();
			var selectedItem = listItems[this._selectedItemIdx] ? listItems[this._selectedItemIdx] : listItems[0];
			if (selectedItem) {
				list.setSelectedItem(selectedItem);
				this.showDetail(selectedItem);
			}
		},

		/**
		 * wait until this.oInitialLoadFinishedDeferred is resolved, and list view updated
		 * @param{function} fnToExecute the function will be executed if this.oInitialLoadFinishedDeferred is resolved
		 */
		waitForInitialListLoading: function(fnToExecute) {
			jQuery.when(this.oInitialLoadFinishedDeferred).then(jQuery.proxy(fnToExecute, this));
		},

		/**
		 * Detail NotFound event handler
		 */
		onNotFound: function() {
			this.getView().byId("list").removeSelections();
		},

		/**
		 * set the first item as selected item
		 */
		selectFirstItem: function() {
			var oList = this.getView().byId("list");
			var aItems = oList.getItems();
			if (aItems.length) {
				oList.setSelectedItem(aItems[0], true);
				this._selectedItemIdx = 0;
			}
		},

		/**
		 * Event handler for the master search field. Applies current
		 * filter value and triggers a new search. If the search field's
		 * 'refresh' button has been pressed, no new search is triggered
		 * and the list binding is refresh instead.
		 */
		onSearch: function() {
			// add filter for search
			var filters = [];
			var searchString = this.getView().byId("searchField").getValue();
			if (searchString && searchString.length > 0) {
				filters = [new sap.ui.model.Filter("approvalSubject", sap.ui.model.FilterOperator.Contains, searchString)];
			}

			// update list binding
			var list = this.getView().byId("list");
			list.getBinding("items").filter(filters);
			this._selectedItemIdx = list.indexOfItem(list.getSelectedItem());
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 */
		onSelect: function(oEvent) {
			// Get the list item, either from the listItem parameter or from the event's
			// source itself (will depend on the device-dependent mode).
			var model = this.getView().getModel();
			var list = this.getView().byId("list");
			var item = oEvent.getParameter("listItem") || oEvent.getSource();
			if (model.hasPendingChanges() || model.newEntryContext) {
				this.openCancelConfirmDialog();
				this._onConfirmAction = jQuery.proxy(function() {
					this._selectedItemIdx = list.indexOfItem(oEvent.getParameter("listItem"));
					this.showDetail(item);
				}, this);
			} else {
				this._selectedItemIdx = list.indexOfItem(oEvent.getParameter("listItem"));
				this.showDetail(item);
			}
		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 */
		showDetail: function(oItem) {
			// If we're on a phone, include nav in history; if not, don't.
			var bReplace = Device.system.phone ? false : true;
			this.getRouter().navTo("detail", {
				from: "master",
				entity: oItem.getBindingContext().getPath().substr(1),
				tab: this.sTab
			}, bReplace);
		},

		/**
		 * AddItem button handler
		 */
		addItem: function() {

			var model = this.getView().getModel();
			if (model.hasPendingChanges() || model.newEntryContext) {
				this.openCancelConfirmDialog();
				this._onConfirmAction = this.executeAddItem;
			} else {
				this.executeAddItem();
			}
		},

		/**
		 * add a new record to offline store
		 */
		executeAddItem: function() {
			//var oEventBus = this.getEventBus();
			//oEventBus.publish("Master", "AddItem");
			var oList = this.getView().byId("list");
			var bindingPath = oList.getBinding("items").getPath();

			var bReplace = Device.system.phone ? false : true;
			this.getRouter().navTo("detail", {
				from: "master",
				entity: bindingPath.substr(1),
				tab: "AddItem"
			}, bReplace);
		},

		/**
		 * open cancelConfirmDialog
		 */
		openCancelConfirmDialog: function() {
			if (!this._cancelConfirmDialog) {
				var id = this.getView().getId();
				var frgId = id + "-_cancelConfirmDialog";
				this._cancelConfirmDialog = sap.ui.xmlfragment(frgId, "cot.view.CancelConfirmDialog", this);
				this.getView().addDependent(this._cancelConfirmDialog);
			}
			this._cancelConfirmDialog.open();
		},

		/**
		 * cancelConfirmDialog "yes" button handler
		 */
		confirmCancel: function() {
			if (this._onConfirmAction) {
				if (this._cancelConfirmDialog) {
					this._cancelConfirmDialog.close();
				}

				this._onConfirmAction.apply(this, arguments);
				this._onConfirmAction = null;
			}
		},

		/**
		 * close cancelConfirmDialog
		 */
		closeCancelConfirmDialog: function() {
			if (this._cancelConfirmDialog) {
				this._cancelConfirmDialog.close();
			}
			var list = this.getView().byId("list");
			if (list.indexOfItem(list.getSelectedItem()) !== this._selectedItemIdx) {
				var selectedItem = list.getItems()[this._selectedItemIdx];
				if (selectedItem) {
					list.setSelectedItem(selectedItem);
				}
			}
		},

		/**
		 * refreshing offline store data
		 */
		refreshData: function() {
			var model = this.getView().getModel();
			if (model.hasPendingChanges() || model.newEntryContext) {
				this.openCancelConfirmDialog();
				this._onConfirmAction = jQuery.proxy(function() {
					if (devapp.isLoaded) {
						if (devapp.isOnline) {
							var oEventBus = this.getEventBus();
							oEventBus.publish("OfflineStore", "Refreshing");
						} else {
							model.refresh();
						}
					} else {
						model.refresh();
					}
				}, this);
			} else {
				if (devapp.isLoaded) {
					if (devapp.isOnline) {
						var oEventBus = this.getEventBus();
						oEventBus.publish("OfflineStore", "Refreshing");
					} else {
						model.refresh();
					}
				} else {
					model.refresh();
				}
			}
		},

		onErrorBTVisible: function(errCount) {
			var bShow = false;
			if (errCount > 0) {
				bShow = true;
			}

			return bShow;
		},

		onErrorPress: function() {
			var oEventBus = this.getEventBus();
			oEventBus.publish("OfflineStore", "OpenErrDialog");
		}
	});
});