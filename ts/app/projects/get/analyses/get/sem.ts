/// <reference path="../../../../../ts-definitions/DefinitelyTyped/angularjs/angular.d.ts"/>
/// <reference path="../../../../../ts-definitions/DefinitelyTyped/angular-ui/angular-ui-router.d.ts"/>
/// <reference path="../../../../../ts-definitions/DefinitelyTyped/d3/d3.d.ts"/>
/// <reference path="../../../../../lib/egrid-client.d.ts"/>
/// <reference path="../../../../../lib/egrid-core.d.ts"/>
/// <reference path="../../../../../lib/sem.d.ts"/>

module egrid.app {
export class SemProjectAnalysisController {
  public static $inject: string[] = ['$scope', 'grid'];
  public static resolve = {
    grid: ['$q', '$stateParams', ($q: ng.IQService, $stateParams: ng.ui.IStateParamsService) => {
      return model.ProjectGrid.get($stateParams['projectKey'], $stateParams['analysisKey']);
    }],
  };
  public encoding: string = 'utf-8';
  public pathMatrix: any[][];
  public gfiValue: number;
  private sem: any;
  private grid: any;
  private semGrid: any;
  private x: number[][];
  private attributes: string[];

  constructor(private $scope, private gridData: model.ProjectGrid) {
    this.grid = egrid.core.grid(gridData.nodes, gridData.links);
    var width = $('#display-wrapper').width();
    var height = $('#display-wrapper').height();
    this.sem = egrid.core.egm()
      .size([width, height])
      .dagreRankSep(80)
      .dagreEdgeSep(40);

    var cache = localStorage.getItem('sem:' + this.gridData.key);
    if (cache) {
      cache = JSON.parse(cache);
      this.x = cache.x;
      this.attributes = cache.attributes;
      this.pathMatrix = cache.pathMatrix;
      this.solve();
    }
  }

  loadFile() {
    var file = (<any>d3.select("#fileInput").node()).files[0];
    var reader = new FileReader();
    reader.onload = e => {
      var data = d3.csv.parse(e.target.result);
      this.attributes = [];
      for (var attr in data[0]) {
        this.attributes.push(attr);
      }
      this.x = this.attributes.map(key => {
        return data.map(d => {
          return +d[key];
        });
      });
      var n = this.x.length;
      var P = sem.stats.partialcorr(this.x);
      this.pathMatrix = this.x.map((_, i) => {
        return this.x.map((_, j) => {
          return {
            p: P[i][j],
            connected: false
          };
        });
      });

      var graph = this.grid.graph();
      var wf = egrid.core.graph.warshallFloyd()
        .weight(() => 1);
      var egmPaths = wf(graph);
      var egmNodes = {};
      graph.vertices().forEach(u => {
        egmNodes[graph.get(u).text] = u;
      });
      for (var i = 0; i < n; ++i) {
        for (var j = i; j < n; ++j) {
          if (Math.abs(this.pathMatrix[i][j].p) > 0.1) {
            var u = egmNodes[this.attributes[i]];
            var v = egmNodes[this.attributes[j]];
            if (u !== undefined && v !== undefined && i != j && egmPaths[u][v] < Infinity) {
              this.pathMatrix[i][j].connected = true;
            } else if (u !== undefined && v !== undefined && i != j && egmPaths[v][u] < Infinity) {
              this.pathMatrix[j][i].connected = true;
            } else  {
              this.pathMatrix[i][j].connected = true;
              this.pathMatrix[j][i].connected = true;
            }
          }
        }
      }

      this.solve();
      this.$scope.$apply();
    };
    reader.readAsText(file, this.encoding);
  }

  solve() {
    var n = this.x.length;
    var alpha = [];
    var sigma = [];
    var s = sem.stats.cov(this.x);
    for (var i = 0; i < n; ++i) {
      for (var j = i; j < n; ++j) {
        if (this.pathMatrix[i][j].connected && this.pathMatrix[j][i].connected) {
          sigma.push([i, j]);
        } else if (this.pathMatrix[i][j].connected) {
          alpha.push([i, j]);
        } else if (this.pathMatrix[j][i].connected) {
          alpha.push([j, i]);
        }
      }
    }

    sem.solver()
      .solve(n, alpha, sigma, s)
      .then(result => {
        this.gfiValue = result.GFI;
        this.semGrid = egrid.core.grid();
        var graph = this.semGrid.graph();
        var vertices = this.attributes.map(attr => {
          return graph.addVertex({
            text: attr,
          });
        });
        var paths = vertices.map(function() {
          return vertices.map(function() {
            return null;
          });
        });
        result.alpha.forEach(link => {
          var u = vertices[link[0]];
          var v = vertices[link[1]];
          graph.addEdge(u, v);
          paths[u][v] = link[2];
        });

        var edgeWidthScale = d3.scale.linear()
          .domain([0, d3.max(result.alpha, (link) => {
            return Math.abs(link[2]);
          })])
          .range([1, 5]);
        var edgeTextFormat = d3.format(' 4.3g')
        this.sem
          .edgeColor(function(u, v) {
            return paths[u][v] >= 0 ? 'blue' : 'red';
          })
          .edgeText(function(u, v) {
            return edgeTextFormat(paths[u][v]);
          })
          .edgeWidth(function(u, v) {
            return edgeWidthScale(Math.abs(paths[u][v]));
          });

        d3.select('#display')
          .datum(graph)
          .call(this.sem.css())
          .call(this.sem)
          .call(this.sem.center());

        localStorage.setItem('sem:' + this.gridData.key, JSON.stringify({
          x: this.x,
          attributes: this.attributes,
          pathMatrix: this.pathMatrix,
        }));

        this.$scope.$apply();
      });
  }

  addFactor() {
  }
}
}
