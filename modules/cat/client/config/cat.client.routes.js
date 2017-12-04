(function () {
  'use strict';

  //Setting up route
  angular
    .module('cat')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    // Cat state routing
    $stateProvider
      .state('cat', {
        url: '/catalog',
        templateUrl: 'modules/cat/client/views/cat.client.view.html',
        controller: 'CatController',
        controllerAs: 'vm'
      });
  }
})();
