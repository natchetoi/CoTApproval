sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("cot.controller.Login", {

        /**
         * Called when a controller is instantiated and its View controls (if available) are already created.
         * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
         * @memberOf cot.view.Login
         */
        //	onInit: function() {
        //
        //	},

        /**
         * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
         * (NOT before the first rendering! onInit() is used for that one!).
         * @memberOf cot.view.Login
         */
        //	onBeforeRendering: function() {
        //
        //	},

        /**
         * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
         * This hook is the same one that SAPUI5 controls get after being rendered.
         * @memberOf cot.view.Login
         */
        onAfterRendering: function () {

            var loginButton = this.getView().byId("loginButtonId");
            loginButton.addEventDelegate({
                onAfterRendering: function () {
                    loginButton.focus();
                }
            });

            jQuery.sap.delayedCall(500, this, function () {
                loginButton.focus();
            });

        },

        /**
         * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
         * @memberOf cot.view.Login
         */
        //	onExit: function() {
        //
        //	}

        //-----------------------------------------------------------------------------
        getRouter: function () {
            return sap.ui.core.UIComponent.getRouterFor(this);
        },


// -------------------------------------------------------------------------------------		

        loadRequests: function () {
            var self = this;
            var url = "localService/mockdata/ApprovalReqSet.json";
            if (window.coTShared.on) {
                url = "http://fusionrv.corp.toronto.ca/Fusion/APIService/rooms/";
            }

            var headers = {"Content-Type": "application/json"};

            jQuery.ajax({
                url: url,
                type: "GET",
                headers: headers,
                dateType: "text",
                contentType: "application/json",
                async: true,
                crossDomain: true,
                success: function (data, textStatus, jqXHR) { // callback called when data is
                    var requests = data;
                    var model = new sap.ui.model.json.JSONModel();
                    model.setData(requests);
                    sap.ui.getCore().setModel(model, "requests");
                    self.mainScreen();
                },
                error: function (data, textStatus, jqXHR) {
                    sap.m.MessageToast.show("Error: " + data.statusText + " " + textStatus, {
                        duration: "200",
                        width: "15em",
                        my: "center top",
                        at: "center top",
                        offset: "0 0",
                        iNumber: 2,
                        autoClose: true,
                        onClose: function () {
//				                    self.mainScreen();
                        }
                    });
                }
            });
        },

        mainScreen: function () {
            var router = sap.ui.core.UIComponent.getRouterFor(this);
            router.navTo("Master", {}, true);
        },

        createSession: function () {
            var self = this;

            var userName = this.getView().byId("username").getValue();
            var password = this.getView().byId("password").getValue();

            var param = //JSON.stringify(
                {
                    "user": userName,
                    "pwd": password,
                    "app": "deploy"
                };
            var url = "https://was8-intra-dev.toronto.ca/cc_sr_admin_v1/session/";
            jQuery.ajax({
                url: url,
                type: "POST",
                data: param,
                dataType: "json",
                contentType: "application/x-www-form-urlencoded",
                async: true,
                crossDomain: true,
                success: function (data, textStatus, jqXHR) { // callback called when data is
                    var name = "Success";
                    if (data !== undefined && data.cotUser !== undefined) {
                        name = data.cotUser.firstName + " " + data.cotUser.lastName;
                    }
                    var userData = {
                        "userName": userName
                    };
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(userData);  // fill the received data into the JSONModel
                    sap.ui.getCore().setModel(oModel, "user");  // Store in the Model

                    sap.m.MessageToast.show("Hello " + name, {
                        duration: "2000",
                        width: "15em",
                        my: "center top",
                        at: "center top",
                        offset: "0 0",
                        iNumber: 2,
                        autoClose: true,
                        onClose: function () {
                            self.login(userName);
                        }
                    });
                },

                error: function (data, textStatus, jqXHR) {
                    sap.m.MessageToast.show("Error: " + data.statusText + " " + textStatus, {
                        duration: "2000",
                        width: "15em",
                        my: "center top",
                        at: "center top",
                        offset: "0 0",
                        iNumber: 2,
                        autoClose: true,
                        onClose: function () {
                            self.login();
                        }
                    });
                }
            });
        },

        onLogin: function (oEvent) {
            window.coTShared.on = false;
            if (window.coTShared.on) {
                this.createSession();
            } else {
                var userName = this.getView().byId("username").getValue();
                this.login(userName);
            }

            //	   	  this.getRouter().navTo("mymeetings", {}, true );

        },

        login: function (userName) {
            this.loadRequests(userName);
        }
    });

});