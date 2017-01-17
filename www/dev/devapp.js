sap.ui.define([
    "sap/m/Shell",
    "sap/ui/core/ComponentContainer",
    "sap/m/MessageBox",
    "cot/dev/devlogon"
], function (Shell, ComponentContainer, MessageBox, devlogon) {
    "use strict";

    return {
        smpInfo: {},
        isLoaded: false,
        isOnline: false,
        definedStore: {},
        errorArchive: [],
        devLogon: devlogon,

        //Application Constructor
        initialize: function () {
            this.bindEvents();
        },

        //========================================================================
        // Bind Event Listeners
        //========================================================================
        bindEvents: function () {
            //add an event listener for the Cordova deviceReady event.
            document.addEventListener("deviceready", jQuery.proxy(this.onDeviceReady, this), false);
            document.addEventListener("online", jQuery.proxy(this.deviceOnline, this), false);
            document.addEventListener("offline", jQuery.proxy(this.deviceOffline, this), false);
            //onDeviceReady has been triggered already
            if (window.isDeviceReady) {
                this.onDeviceReady();
            }
        },

        //========================================================================
        //Cordova Device Ready
        //========================================================================
        onDeviceReady: function () {
            if (window.sap_webide_FacadePreview) {
                this.startApp();
            } else {
                var that = this;

                //get offline definingRequests
                $.getJSON("manifest.json", function (desData) {
                    var def = desData["sap.mobile"]["definingRequests"];
                    for (var o in def) {
                        if (def[o]["dataSource"] === "mainService") {
                            that.definedStore[o] = def[o]["path"];
                        }
                    }

                    $.getJSON("dev/service.json", function (data) {
                        if (data) {
                            if (data.logon) {
                                that.smpInfo.server = data.host;
                                that.smpInfo.port = data.port;
                                that.smpInfo.appID = data.appID;
                            }
                            //check cordova plugin
                            if (data.network) {
                                that.offline = true;
                                if (navigator.connection.type !== Connection.NONE) {
                                    that.isOnline = true;
                                }
                            } else {
                                that.offline = false;
                                //pop up message box to show the fatal error
                                MessageBox.alert("Cordova network plugin is not selected. Offline function is disabled.");
                            }

                            var context = {};
                            if (that.smpInfo.server && that.smpInfo.server.length > 0) {
                                context.serverHost = that.smpInfo.server;
                                context.serverPort = that.smpInfo.port;
                            }

                            context.https = data.https;
                            context.applicationEndpointURL = data.applicationEndpointURL;

                            //save it
                            that.devLogon.devapp = that;
                            that.devLogon.devapp.appContext = context;


                            if (data.logon) {
                                that.devLogon.doLogonInit(context, that.smpInfo.appID);
                            }
                            else {
                                that.startApp();
                            }
                        }
                        else {
                            that.startApp();
                        }


                    });
                });
            }
        },

        //========================================================================
        //Cordova deviceOnline event handler
        //========================================================================
        deviceOnline: function () {
            //sap.m.MessageToast.show("Device is Online", { duration: 1000});
            if (this.isLoaded && this.deviceModel) {
                this.deviceModel.setProperty("/isOffline", false);
            }
            this.isOnline = true;
        },

        //========================================================================
        //Cordova deviceOffline event handler
        //========================================================================
        deviceOffline: function () {
            //sap.m.MessageToast.show("Device is Offline", { duration: 1000});
            if (this.isLoaded && this.deviceModel) {
                this.deviceModel.setProperty("/isOffline", true);
            }
            this.isOnline = false;
        },

        /**
         * find parameter name from page URL
         * @param{String} sParam parameter name
         * @returns {boolean}} if finding the assigned name or not
         */
        findUrlParameterName: function (sParam) {
            var sPageURL = window.location.search.substring(1);
            var sURLVariables = sPageURL.split('&');
            for (var i = 0; i < sURLVariables.length; i++) {
                var sParameterName = sURLVariables[i].split('=');
                if (sParameterName[0] === sParam) {
                    return true;
                }
            }
            return false;
        },

        //========================================================================
        //start application
        //========================================================================
        startApp: function () {
            sap.ui.getCore().attachInit(function () {
                new Shell({
                    app: new ComponentContainer({
                        height: "100%",
                        name: "cot"
                    })
                }).placeAt("content");
            });
        }
    };
});