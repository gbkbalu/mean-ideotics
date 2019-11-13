'use strict';
//angular
//	.module('ideotics')
//	.service('Session', Session);
//	
//function Session($localStorage) {
//	
//	var that = this;
//	
//	if ($localStorage.session !== null || typeof $localStorage.session !== 'undefined') {
//		
//		that.id = $localStorage.session.id;
//		that.userId = $localStorage.session.userId;
//		that.userRole = $localStorage.session.userRole;
//	}
//	
//	this.create = function(sessionId, userId, userRole, userName) {
//		this.id = sessionId;
//		this.userId = userId;
//		this.userRole = userRole;
//		
//		$localStorage.session = {};
//		
//		$localStorage.session.id = this.id;
//		$localStorage.session.userId = this.userId;
//		$localStorage.session.userRole = this.userRole;
//	};
//	
//	this.destroy = function() {
//		this.id = null;
//		this.userId = null;
//		this.userRole = null;
//		
//		$localStorage.session.id = null;
//		$localStorage.session.userId = null;
//		$localStorage.session.userRole = null;
//	};
//}