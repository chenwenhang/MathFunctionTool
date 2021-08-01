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
        // 函数预处理
        pre_process: function (func) {
            function abs_process(func) {
                let tmp_txt = func.replace(/\|(.*?)\|/g, "abs($&)");
                func = tmp_txt.replace(/\|/g, "");
                return func
            }
            function arc_process(func, arc_str) {
                let arc_left = arc_str + "("
                let arc_right = ""
                let stack = []
                tmp_txt = "";
                switch (arc_str) {
                    case "arccos":
                        arc_right = "(cos(";
                        break;
                    case "arcsin":
                        arc_right = "(sin(";
                        break;
                    case "arctan":
                        arc_right = "(tan(";
                        break;
                    default:
                        break;
                }
                for (let i = 0; i < func.length; i++) {
                    let c = func.charAt(i)
                    if (c === "(") {
                        if (i >= 6 && func.slice(i - 6, i + 1) === arc_left) {
                            tmp_txt = tmp_txt.slice(0, tmp_txt.length - 6) + arc_right
                            stack.push(arc_left)
                        } else {
                            tmp_txt += c
                            stack.push("(")
                        }
                    } else if (c === ")") {
                        let s = stack.pop()
                        if (s === "(") {
                            tmp_txt += ")"
                        } else {
                            tmp_txt += "))^(-1)"
                        }
                    } else {
                        tmp_txt += c
                    }
                }
                return tmp_txt
            }

            // func = "arccos(s + arcsin(a(x) + b(x)) + s + arctan(x))"
            origin = func
            try {
                // console.log(func);

                // 1. 替换形如|x|为abs(x)，正则表达式懒惰匹配模式
                func = abs_process(func)

                // 2. 替换形如arccos(x)为(cos(x))^(-1)，arctan(x)、arcsin(x)同理
                func = arc_process(func, "arccos")
                func = arc_process(func, "arcsin")
                func = arc_process(func, "arctan")

                // console.log(func);

            } catch (exception) {
                func = origin
            }
            return func
        },

        // 绘制函数图像
        draw_function: function () {
            let data = []
            this.func_list.forEach(ele => {
                switch (ele.fnType) {
                    case "normal":
                        data.push({
                            fn: this.pre_process(ele.fn)
                        })
                        break;
                    case "polar":
                        data.push({
                            r: this.pre_process(ele.fn_polar),
                            fnType: "polar",
                            graphType: 'polyline'
                        })
                        break;
                    case "parametric":
                        data.push({
                            x: this.pre_process(ele.parametric_fn_x),
                            y: this.pre_process(ele.parametric_fn_y),
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