sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent"
], function(Controller, UIComponent) {
	"use strict";

	return Controller.extend("cot.util.Controller", {
		/**
		 * get the event bus of the applciation component
		 * @returns {Object} the event bus
		 */
		getEventBus: function() {
			return sap.ui.getCore().getEventBus();
		},

		/**
		 * get the UIComponent router
		 * @param{Object} this either a view or controller
		 * @returns {Object} the event bus
		 */
		getRouter: function() {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		}
	});
});