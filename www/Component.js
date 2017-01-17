
jQuery.sap.registerModulePath("libs", "/libs/");
sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/odata/ODataModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"cot/dev/devapp",
	"cot/MyRouter"
], function(UIComponent, ODataModel, JSONModel, Device, devapp) {
	"use strict";

	return UIComponent.extend("cot.Component", {
		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * In this method, the resource and application models are set and the router is initialized.
		 */
		init: function() {
			var oModel, appContext, sServiceUrl;
			//create odata model for kapsel application
			var param = {
				"json": true,
				loadMetadataAsync: true
			};

			if (window.cordova && !window.sap_webide_FacadePreview && !window.sap_webide_companion) {
				if (devapp.devLogon) {
					appContext = devapp.appContext;
				}
				sServiceUrl = appContext.applicationEndpointURL + "/";
				var oHeader = {
					"X-SMP-APPCID": appContext.applicationConnectionId
				};
				if (appContext.registrationContext && appContext.registrationContext.user) {
					oHeader.Authorization = "Basic " + btoa(appContext.registrationContext.user + ":" + appContext.registrationContext.password);
				}
				param.headers = oHeader;
			} else {
				var appMeta = this.getMetadata().getManifestEntry("sap.app");
				sServiceUrl = appMeta.dataSources.mainService.uri;
			}
			oModel = new ODataModel(sServiceUrl, param);
			oModel.setDefaultBindingMode("TwoWay");
			this.setModel(oModel);
			devapp.appModel = oModel;

			// set device model
			var oDeviceModel = new JSONModel({
				isTouch: Device.support.touch,
				isNoTouch: !Device.support.touch,
				isPhone: Device.system.phone,
				listMode: Device.system.phone ? "None" : "SingleSelectMaster",
				listItemType: Device.system.phone ? "Active" : "Inactive",
				isOffline: Device.system.phone ? !devapp.isOnline : false,
				errorNum: 0
			});
			oDeviceModel.setDefaultBindingMode("OneWay");
			this.setModel(oDeviceModel, "device");

			if (window.cordova) {
				devapp.deviceModel = oDeviceModel;
			}

			UIComponent.prototype.init.apply(this, arguments);
			this.getRouter().initialize();

			//check errorArchive count
			if (devapp.isLoaded) {
				devapp.devLogon.getErrorArchiveCount();
			}

			window.coTShared = {};
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass: function() {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},
// ---------------------------------------------------------------------------------------------
		loadData: function() {
			var self = this;
			var url = "model/rooms.json";			
			if(window.coTShared.on) {
			    url = "http://fusionrv.corp.toronto.ca/Fusion/APIService/rooms/";
			}
			
			var headers = { "Content-Type": "application/json" };
			
			var aData = jQuery.ajax({
				              url: url,  
			                  type : "GET",
			            	  headers: headers,
			                  dateType: "text",
				              contentType : "application/json",
			                  async: true, 
			                  crossDomain : true,
			            success: function(data, textStatus, jqXHR) { // callback called when data is 

		                  var rooms = [];   
					      var list = data.API_Rooms;
					      var n = list.length;

			                  for(var i = 0; i< n; i++) {
			                  	try {
			                  	  var roomData = list[i];
			                      var RoomName = roomData.RoomName;
			                      var RoomID = roomData.RoomID;
			                      var _room = {
			                      	"RoomName" : RoomName,
			                      	"RoomID" : RoomID
			                      };
			                      rooms.push(_room);
			                  	} catch(err) {
			                  		alert(err);
			                  	}
			                 } 
			                 
//			                 self.mainScreen();
			            },
			           error: function(data, textStatus, jqXHR) {
							sap.m.MessageToast.show("Error: " + data.statusText + " "  + textStatus, {
								duration: "200",
								width: "15em",
								my: "center top",
								at: "center top",
								offset: "0 0",
								iNumber: 2,
								autoClose: true,
								onClose: function() {
//				                    self.mainScreen();
								}			        	   
			                 });
			                 }
			            });		        			
		}

		
		
	});
});