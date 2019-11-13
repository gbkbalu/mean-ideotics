'use strict';
angular
	.module('ideotics')
	.constant('USER_ROLES', {
		all: '*',
		admin: 'admin',
		agent: 'agent',
		reviewer: 'reviewer'
	});