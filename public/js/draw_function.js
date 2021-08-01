/* jshint esversion: 6 */
function plot(param) {
    data = []
    if (param.data) {
        data = param.data
    }
    data.push({
        points: [
            [0, 0],
        ],
        fnType: 'points',
        graphType: 'scatter'
    })
    $('#root').empty()
    functionPlot({
        target: "#root",
        width: $('#root').width(),
        height: $('#root').width(),
        xAxis: {
            domain: param.x_range
        },
        yAxis: {
            domain: param.y_range
        },
        grid: true,
        data: data
    });
}

$(document).ready(function () {
    plot({
        x_range: [-5, 5],
        y_range: [-5, 5],
    });
});

$(window).resize(function () {
    plot({
        x_range: [-5, 5],
        y_range: [-5, 5],
    });
});

var app = new Vue({
    el: '#app',
    data: {
        min_x: -5,
        max_x: 5,
        min_y: -5,
        max_y: 5,
        func_list: [{
            fnType: "normal",
            fn: "",
            fn_polar: "",
            parametric_fn_x: "",
            parametric_fn_y: "",
            parametric_min_t: "",
            parametric_max_t: "",
            point_x: "",
            point_y: "",
        }]
    },
    methods: {
        // 绘制函数图像
        draw_function: function () {
            let data = []
            this.func_list.forEach(ele => {
                switch (ele.fnType) {
                    case "normal":
                        data.push({
                            fn: ele.fn
                        })
                        break;
                    case "polar":
                        data.push({
                            r: ele.fn_polar,
                            fnType: "polar",
                            graphType: 'polyline'
                        })
                        break;
                    case "parametric":
                        data.push({
                            x: ele.parametric_fn_x,
                            y: ele.parametric_fn_y,
                            fnType: "parametric",
                            range: [ele.parametric_min_t * Math.PI, ele.parametric_max_t * Math.PI],
                            graphType: "polyline"
                        })
                        break;
                    case "point":
                        data.push({
                            points: [
                                [ele.point_x, ele.point_y],
                            ],
                            fnType: 'points',
                            graphType: 'scatter'
                        })
                        break;
                    case "haveparam":

                        break;
                    case "integral":

                        break;
                    case "differential":

                        break;
                    default:
                        break;
                }
            });
            try {
                plot({
                    data: data,
                    x_range: [this.min_x, this.max_x],
                    y_range: [this.min_y, this.max_y],
                })
            } catch (exception) {
                alert("输入似乎不大对，检查一下~")
            }
        },

        // 添加函数
        add_function: function (params) {
            this.func_list.push({
                fnType: "normal",
                fn: "",
                fn_polar: "",
                parametric_fn_x: "",
                parametric_fn_y: "",
                parametric_min_t: "",
                parametric_max_t: "",
                point_x: "",
                point_y: "",
            })
        },

        // 删除函数
        del_fuction: function (index) {
            this.func_list.splice(index, 1);
        }

    }

})