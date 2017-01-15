sap.ui.define([
	"sap/m/BusyDialog",
	"sap/m/MessageBox",
	"sap/ui/thirdparty/datajs"
], function(BusyDialog, MessageBox) {
	"use strict";

	return {
		appContext: null,
		appOfflineStore: {},
		devapp: null,

		/********************************************************************
		 * Initialize the application
		 * In this case, it will check first of the application has already
		 * registered with the SMP server. If not, it will register the app
		 * then proceed to manage the logon process.
		 * @param{Object} context SMP/HCPms logon input context
		 * @param{String} appId SMP/HCPms application ID
		 ********************************************************************/
		doLogonInit: function(context, appId) {
			//set offline store attribute first
			this.appOfflineStore.appID = appId;
			this.appOfflineStore.interval = 300000; //5 minutes

			//Make call to Logon's Init method to get things registered and all setup
			if (this.devapp.definedStore && this.devapp.offline) {
				this.openStore = true;
			}
			var that = this;
			sap.Logon.init(
				function(context) {
					//Make sure Logon returned a context for us to work with
					if (context) {
						//Store the context away to be used later if necessary
						that.appContext = context;
						if (that.openStore) {
							//open offline store
							that.openAppOfflineStore();
							that.openStore = false;
						} else if (!that.devapp.isLoaded) {
							//start app
							that.devapp.startApp();
							that.devapp.isLoaded = true;
						}
					}
				},
				function(errObj) {
					if (errObj) {
						MessageBox.alert(JSON.stringify(errObj));
					} else {
						MessageBox.alert("logon failed.");
					}
				}, appId, context);
		},

		/********************************************************************
		 * Delete the application's registration information
		 * Disconnects the app from the SMP server
		 ********************************************************************/
		doDeleteRegistration: function() {
			var that = this;
			if (this.appContext) {
				//Call logon's deleteRegistration method
				sap.Logon.core.deleteRegistration(
					function(res) {
						that.appContext = null;
						//reset the app to its original packaged version
						//(remove all updates retrieved by the AppUpdate plugin)
						sap.AppUpdate.reset();
					},
					function(errObj) {
						if (errObj) {
							MessageBox.alert(JSON.stringify(errObj));
						}
					});
			}
		},

		/********************************************************************
		 * Lock the DataVault
		 ********************************************************************/
		doLogonLock: function() {
			//Everything here is managed by the Logon plugin, there's nothing for
			//the developer to do except to make the call to lock to
			//Lock the DataVault
			sap.Logon.lock(
				function() {

				},
				function(errObj) {
					if (errObj) {
						MessageBox.alert(JSON.stringify(errObj));
					}
				});
		},

		/********************************************************************
		 * Unlock the DataVault
		 ********************************************************************/
		doLogonUnlock: function() {
			//Everything here is managed by the Logon plugin, there's nothing for
			//the developer to do except to make the call to unlock.
			sap.Logon.unlock(
				function(ctx) {

				},
				function(errObj) {
					if (errObj) {
						MessageBox.alert(JSON.stringify(errObj));
					}
				});
		},

		/********************************************************************
		 * Show the application's registration information
		 ********************************************************************/
		doLogonShowRegistrationData: function() {
			//Everything here is managed by the Logon plugin, there's nothing for
			//the developer to do except to make a call to showRegistratioData
			sap.Logon.showRegistrationData(
				function() {

				},
				function(errObj) {
					if (errObj) {
						MessageBox.alert(JSON.stringify(errObj));
					}
				});
		},

		/********************************************************************
		 * Update the DataVault password for the user
		 ********************************************************************/
		doLogonChangePassword: function() {
			//Everything here is managed by the Logon plugin, there's nothing for
			//the developer to do except to make the call to changePassword
			sap.Logon.changePassword(
				function() {

				},
				function(errObj) {
					if (errObj) {
						MessageBox.alert(JSON.stringify(errObj));
					}
				});
		},

		/********************************************************************
		 * Change the DataVaule passcode
		 ********************************************************************/
		doLogonManagePasscode: function() {
			//Everything here is managed by the Logon plugin, there's nothing for
			//the developer to do except to make the call to managePasscode
			sap.Logon.managePasscode(
				function() {

				},
				function(errObj) {
					if (errObj) {
						MessageBox.alert(JSON.stringify(errObj));
					}
				});
		},

		/********************************************************************
		 * Write values from the DataVault
		 * @param{String} theKey the key to store the provided object on
		 * @param{Object} theValue the object to be set on the given key. Must be JSON serializable (cannot contain circular references).
		 ********************************************************************/
		doLogonSetDataVaultValue: function(theKey, theValue) {
			//Write the values to the DataVault
			sap.Logon.set(
				function() {

				},
				function(errObj) {
					if (errObj) {
						MessageBox.alert(JSON.stringify(errObj));
					}
				}, theKey, theValue);
		},

		/********************************************************************
		 * Read values from the DataVault
		 * @param{String}} theKey the key with which to query the DataVault.
		 ********************************************************************/
		doLogonGetDataVaultValue: function(theKey) {
			//Read the value from the DataVault
			sap.Logon.get(
				function(value) {

				},
				function(errObj) {
					if (errObj) {
						MessageBox.alert(JSON.stringify(errObj));
					}
				}, theKey);
		},

		/********************************************************************
		 * Creates a new OfflineStore object.
		 * Need to be online in the first time when the store is created.
		 * The store will be available for offline access only after it is open successfully.
		 ********************************************************************/
		openAppOfflineStore: function() {
			if (!this.appOfflineStore.store) {
				//this.appOfflineStore.startTime = new Date();
				var reqObj = this.devapp.definedStore;
				var properties = {
					"name": "MasterDetailAppOfflineStore",
					"host": this.appContext.registrationContext.serverHost,
					"port": this.appContext.registrationContext.serverPort,
					"https": this.appContext.registrationContext.https,
					"serviceRoot": this.appContext.applicationEndpointURL + "/",
					"definingRequests": reqObj
				};
				var that = this;
				this.appOfflineStore.store = sap.OData.createOfflineStore(properties);

				var busyDL = new BusyDialog();
				busyDL.setTitle("Open Offline Store");
				busyDL.setText("creating application offline store...");
				busyDL.open();

				this.appOfflineStore.store.open(
					function() {
						busyDL.close();
						//set offline client
						sap.OData.applyHttpClient();
						that.devapp.startApp();
						that.devapp.isLoaded = true;
					},
					function(e) {
						busyDL.close();
						if (e) {
							MessageBox.alert("Failed to open offline store: " + JSON.stringify(e));
						} else {
							MessageBox.alert("Failed to open offline store.");
						}
					});
			}
		},

		/********************************************************************
		 * refresh offline store, synchronize data from server
		 * need to be online
		 ********************************************************************/
		refreshAppOfflineStore: function() {
			if (!this.appOfflineStore.store) {
				return;
			}
			var oEventBus = sap.ui.getCore().getEventBus();
			var that = this;
			if (this.devapp.isOnline) {
				//this.appOfflineStore.startTimeRefresh = new Date();
				this.appOfflineStore.store.refresh(
					function() {
						//reset
						that.devapp.refreshing = false;
						//publish ui5 offlineStore Synced event
						oEventBus.publish("OfflineStore", "Synced");
					},
					function(e) {
						//reset
						that.devapp.refreshing = false;
						//save the error
						that.appOfflineStore.callbackError = e;
						//publish ui5 offlineStore Synced event
						oEventBus.publish("OfflineStore", "Synced");
					});
			}
		},

		/********************************************************************
		 * flush offline store, push changed data to server, need to be online
		 * if cot.dev.devapp.refreshing is set to true, 
		 * application will continue to call refreshAppOfflineStore() to refresh the offline store.
		 ********************************************************************/
		flushAppOfflineStore: function() {
			if (!this.appOfflineStore.store) {
				return;
			}
			if (this.devapp.isOnline) {
				var that = this;
				//this.appOfflineStore.startTimeRefresh = new Date();
				this.appOfflineStore.store.flush(
					function() {
						//check offline error
						that.readOfflineErrorArchieve();
					},
					function(e) {
						//save the error
						that.appOfflineStore.callbackError = e;
						//check offline error
						that.readOfflineErrorArchieve();
					});
			}
		},

		/********************************************************************
		 * read offline store archieve error message after flush/refresh operation
		 ********************************************************************/
		readOfflineErrorArchieve: function() {
			//clean ErrorArive row url
			this.appOfflineStore.errorArchiveRowURL = null;
			var oEventBus = sap.ui.getCore().getEventBus();
			var that = this;
			this.devapp.appModel.read("/ErrorArchive", null, null, true,
				function(rtData) {
					var bStop = false;
					if (rtData && rtData.results && rtData.results.length > 0) {
						that.devapp.deviceModel.setProperty("/errorNum", rtData.results.length);
						var i;
						for (i = 0; i < rtData.results.length; i++) {
							var errObj = rtData.results[i];

							//get ErrorArchive one row URL, can be any row
							if (!that.appOfflineStore.errorArchiveRowURL && errObj.__metadata &&
								errObj.__metadata.uri && errObj.__metadata.uri.indexOf("ErrorArchive") > 0) {
								that.appOfflineStore.errorArchiveRowURL = "/ErrorArchive" + errObj.__metadata.uri.split("ErrorArchive")[1];
							}

							if (errObj.RequestMethod.toLowerCase() !== "delete") {
								bStop = true;
								if (that.appOfflineStore.errorArchiveRowURL) {
									//if errorArchiveRowURL is set, then exit loop
									break;
								}
							}
						}
					} else {
						//reset the error count
						that.devapp.deviceModel.setProperty("/errorNum", 0);
					}

					if (bStop) {
						//stop refreshing
						that.devapp.refreshing = false;
						//publish ui5 offlineStore Synced event
						oEventBus.publish("OfflineStore", "Synced");
					} else {
						if (that.devapp.refreshing) {
							//continue refreshing
							that.refreshAppOfflineStore();
						} else {
							//publish ui5 offlineStore Synced event
							oEventBus.publish("OfflineStore", "Synced");
						}
					}
				},
				function() {
					//reset the error count
					that.devapp.deviceModel.setProperty("/errorNum", 0);

					if (that.devapp.refreshing) {
						//continue refreshing
						that.refreshAppOfflineStore();
					} else {
						//publish ui5 offlineStore Synced event
						oEventBus.publish("OfflineStore", "Synced");
					}
				}
			);
		},

		/********************************************************************
		 * read offline store archieve error count and set to device model
		 ********************************************************************/
		getErrorArchiveCount: function() {
			var that = this;
			this.devapp.appModel.read("/ErrorArchive", null, null, true,
				function(rtData) {
					if (rtData && rtData.results && rtData.results.length > 0) {
						that.devapp.deviceModel.setProperty("/errorNum", rtData.results.length);

						var i;
						for (i = 0; i < rtData.results.length; i++) {
							var errObj = rtData.results[i];
							//get ErrorArchive one row URL, can be any row
							if (!that.appOfflineStore.errorArchiveRowURL && errObj.__metadata &&
								errObj.__metadata.uri && errObj.__metadata.uri.indexOf("ErrorArchive") > 0) {
								that.appOfflineStore.errorArchiveRowURL = "/ErrorArchive" + errObj.__metadata.uri.split("ErrorArchive")[1];
								break;
							}
						}
					}
				}
			);
		}
	};
});