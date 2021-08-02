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
            fnType: "normal_explicit",
            fn: "",
            fn_polar: "",
            parametric_fn_x: "",
            parametric_fn_y: "",
            parametric_min_t: "",
            parametric_max_t: "",
            point_x: "",
            point_y: "",
            // 光标位置
            pointer: 0
        }]
    },
    methods: {
        // 函数预处理
        pre_process: function (func) {
            function mul_process(func) {
                // 补全^后面的括号
                let tmp_txt = func
                tmp_txt = tmp_txt.replace(/(?<=\^)([0-9]*[a-zA-Zθ]*)/g, "($&)");
                return tmp_txt
            }
            function abs_process(func) {
                // 支持绝对值符号
                let tmp_txt = func.replace(/\|(.*?)\|/g, "abs($&)");
                func = tmp_txt.replace(/\|/g, "");
                return func
            }
            function nobrackets_process(func) {
                let tmp_txt = func
                // 支持所有三角函数不带括号的情况
                tmp_txt = tmp_txt.replace(/(?<=sin)([0-9]*[a-zA-Zθ]+)/g, "($&)");
                tmp_txt = tmp_txt.replace(/(?<=cos)([0-9]*[a-zA-Zθ]+)/g, "($&)");
                tmp_txt = tmp_txt.replace(/(?<=tan)([0-9]*[a-zA-Zθ]+)/g, "($&)");
                tmp_txt = tmp_txt.replace(/(?<=arccos)([0-9]*[a-zA-Zθ]+)/g, "($&)");
                tmp_txt = tmp_txt.replace(/(?<=arcsin)([0-9]*[a-zA-Zθ]+)/g, "($&)");
                tmp_txt = tmp_txt.replace(/(?<=arctan)([0-9]*[a-zA-Zθ]+)/g, "($&)");
                return tmp_txt
            }
            function pi_process(func) {
                // 处理所有的π
                let tmp_txt = func
                tmp_txt = tmp_txt.replace(/(?<=π)([a-zA-Zθ]+)/g, "*$&");
                tmp_txt = tmp_txt.replace(/π/g, "PI");
                return tmp_txt
            }
            function theta_process(func) {
                // 处理所有的θ
                let tmp_txt = func
                tmp_txt = tmp_txt.replace(/(?<=θ)([a-zA-Zθ]+)/g, "*$&");
                tmp_txt = tmp_txt.replace(/θ/g, "theta");
                return tmp_txt
            }
            function exp_process(func) {
                // 处理e相关，转换为exp()函数
                let tmp_txt = func
                // sin(theta)+cos(theta)+e
                tmp_txt = tmp_txt.replace(/exp\(([0-9]*[a-zA-Zθ]*)\)/g, function (word) { // 先替换exp为e
                    return "e^" + word.substring(3, word.length);
                });
                tmp_txt = tmp_txt.replace(/theta/g, "θ"); // 先替换theta为θ
                tmp_txt = tmp_txt.replace(/(?<=e)([a-zA-Zθ]+)/g, "*$&"); // 填充后面的*
                tmp_txt = tmp_txt.replace(/(?<=[0-9]+)(e)/g, "*$&"); // 填充前面的*
                tmp_txt = tmp_txt.replace(/e(\^\([0-9]*[a-zA-Zθ]*\))/g, function (word) { // 处理e^kx的情况，当做 EXPRESSION_TMP(kx)
                    return "EXPRESSION_TMP" + word.substring(2, word.length);
                });
                tmp_txt = tmp_txt.replace(/e[^\^]/g, function (word) { // 处理e的其他情况，当做 EXPRESSION_TMP(1)
                    return "EXPRESSION_TMP(1)" + word.substring(1);
                });

                tmp_txt = tmp_txt.replace(/EXPRESSION_TMP/g, "exp"); // 最终替换为exp
                return tmp_txt
            }
            function arc_process(func, arc_str) {
                // 变种括号匹配算法，替换掉反三角函数，转换为普通三角函数的倒数
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

            // func = "e^x + 3ex + e^2x"
            // func = "nthRoot(2, x)"
            // func = "sin(θ)+cos(θ)+exp(1)"
            // func = "exp(1)"
            origin = func
            try {
                // console.log(func);
                // 此处函数的处理顺序很重要，乱序可能会出问题

                // 0. 添加一个空格，便于正则表达式操作
                func += " "

                // 1. 替换形如|x|为abs(x)，正则表达式懒惰匹配模式
                func = abs_process(func)

                // 2. 在^后添加括号
                func = mul_process(func)

                // 3. 替换e为exp，且做一些处理
                func = exp_process(func)

                // 4. 允许一些常见的没有括号的三角函数，例如cosx，sin3x
                func = nobrackets_process(func)

                // 5. 替换形如arccos(x)为(cos(x))^(-1)，arctan(x)、arcsin(x)同理
                func = arc_process(func, "arccos")
                func = arc_process(func, "arcsin")
                func = arc_process(func, "arctan")

                // 6，替换π为PI，且做一些处理
                func = pi_process(func)

                // 7，替换θ为theta，且做一些处理
                func = theta_process(func)

                // 最后去除空格
                func = func.trim()

                console.log(func);

            } catch (exception) {
                // 说明函数有问题，直接用原函数
                func = origin
            }
            return func
        },

        // 绘制函数图像
        draw_function: function () {
            let data = []
            this.func_list.forEach(ele => {
                switch (ele.fnType) {
                    case "normal_explicit":
                        data.push({
                            fn: this.pre_process(ele.fn),
                        })
                        break;
                    case "normal_implicit":
                        data.push({
                            fn: this.pre_process(ele.fn),
                            fnType: "implicit",
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
                fnType: "normal_explicit",
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
        },

        // 按键监听函数，need_back表示光标需要回退一格
        click_keyboard: function (key, index, inp_ref, pos_change, fn_name) {
            this.$nextTick(() => {
                let len = this.func_list[index][fn_name].length;
                let start = this.$refs[inp_ref][0].selectionStart;
                // 更新函数内容
                this.func_list[index][fn_name] = this.func_list[index][fn_name].substring(0, start) + key + this.func_list[index][fn_name].substring(start, len);
                // 如果移动光标到左边界则return，没有这个判断光标会移动到最右边
                if (start == 0 && pos_change <= 0) {
                    this.$refs[inp_ref][0].focus();
                    return
                }
                // 输入框获取焦点
                this.$refs[inp_ref][0].focus();
                // focus方法是异步的，所以更改光标位置需要在nextTick中延时更新，前端的坑是真TM的多
                this.$nextTick(() => {
                    this.$refs[inp_ref][0].setSelectionRange(start + pos_change, start + pos_change);
                });
            })
        },

        // 删除函数
        keyboard_delete: function (index, inp_ref, fn_name) {
            let len = this.func_list[index][fn_name].length;
            let start = this.$refs[inp_ref][0].selectionStart;
            this.func_list[index][fn_name] = this.func_list[index][fn_name].substr(0, start - 1) + this.func_list[index][fn_name].substr(start, len);
            // 输入框获取焦点
            this.$refs[inp_ref][0].focus();
            this.$nextTick(() => {
                // 更新光标位置
                if (start - 1 <= 0) {
                    this.$refs[inp_ref][0].setSelectionRange(0, 0);
                    return
                }
                this.$refs[inp_ref][0].setSelectionRange(start - 1, start - 1);
            })
        },

        // 输入框失去焦点事件
        blur: function (index, inp_ref) {
            this.$nextTick(() => {
                let start = this.$refs[inp_ref][0].selectionStart;
                this.func_list[index].pointer = start
            })
        }

    }

})