sap.ui.define([], function() {
	"use strict";

	return {
		/**
		 * Upper the first character of giving string
		 * param{String} sStr input string
		 * @returns {String}} the input string with the first uppercase character
		 */
		uppercaseFirstChar: function(sStr) {
			return sStr.charAt(0).toUpperCase() + sStr.slice(1);
		}
	};
});