(function() {
  'use strict';

  angular
    .module('cat')
    .controller('CatController', CatController);

  CatController.$inject = ['$scope', '$location', '$http'];

  function CatController($scope, $location, $http) {
    var vm = this;

    // console.log($location.search());

    // Cat controller logic
    // ...

    $scope.chartOptions = {
      chart: {
        type: 'pieChart',
        height: 500,
        x: function(d){ return d.key; },
        y: function(d){ return d.y; },
        showLabels: false,
        duration: 500,
        labelThreshold: 0.01,
        labelSunbeamLayout: true,
        legend: {
          margin: {
            top: 5,
            right: 35,
            bottom: 5,
            left: 0
          }
        }
      }
    };

    $http.get('/catId', { params: $location.search() }).success(function(data) {
      $scope.items = data;
    }).error(function(err){
      console.log('Error: ' + err);
    });

    $http.get('/catGraph', { params: $location.search() }).success(function(data) {
      $scope.chartData = data.chartData;
      $scope.ownersData = data.ownersData;
      $scope.providersData = data.providersData;
      // $scope.tableParams1 = new NgTableParams({}, {});
      console.log(data);
    }).error(function(err){
      console.log('Error: ' + err);
    });

    init();

    function init() {
    }
  }
})();
