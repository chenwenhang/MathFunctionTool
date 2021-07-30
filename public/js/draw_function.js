/* jshint esversion: 6 */
function plot() {
    functionPlot({
        target: "#root",
        width: $('#root').width(),
        height: $('#root').width() / 1.77,
        yAxis: {
            domain: [-5, 5]
        },
        grid: true,
        data: [{
            points: [
                [0, 0],
            ],
            fnType: 'points',
            graphType: 'scatter'
        }, {
            fn: "x^2",
            derivative: {
                fn: "2 * x",
                updateOnMouseMove: true
            }
        }, {
            fn: "sin(x)",
        }, {
            fn: "x - 1/6 * x^3",
        }
        ]
    });
}

$(document).ready(function () {
    plot();
});

$(window).resize(function () {
    plot();
});