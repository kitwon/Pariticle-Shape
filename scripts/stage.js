/* 
	Author: Kenneth Cachia
	CodePen: http://codepen.io/kennethcachia/pen/Fhvie
	Rewrite & translate: Kit 
*/

var S = {
	init : function() {
		S.Drawing.init('.canvas');
		document.body.classList.add('body--ready');

		S.UI.simulate('Shape|Shifter|Edit|by|Kit||');
		S.Drawing.loop(function() {
			S.Shape.render();
		})
	}
};



/*
S.Drawing
  	@function loop   //执行动画(60帧/s)
  	@function clearFrame   //清空canvas
  	@function drawCircle      //生成点
*/
S.Drawing = (function() {
	var canvas,
		context,
		renderFn,
		requestFrame = window.requestAnimationFrame ||
						 window.webkitRequestAnimationFrame ||
						 window.mozRequestAnimationFrame ||
						 window.oRequestAnimationFrame ||
						 window.msRequestAnimationFrame ||
						 function(callback) {
						 	window.setTimeout(callback, 1000 / 60);
						 };
		
		return {
			init : function(el) {
				canvas = document.querySelector(el);
				context = canvas.getContext('2d');
				this.adjustCanvas();

				window.addEventListener('resize', function(e) {
					S.Drawing.adjustCanvas();
				});
			},
			//执行动画(60帧/s)
			loop : function(fn) {
				renderFn = !renderFn ? fn : renderFn;
				this.clearFrame();
				renderFn();
				requestFrame.call(window, this.loop.bind(this));
			},
			adjustCanvas : function() {
				canvas.width = window.innerWidth;
				canvas.height = window.innerHeight;
			},
			clearFrame : function() {
				context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
			},
			getArea : function() {
				return {
					w : canvas.clientWidth,
					h : canvas.clientHeight
				};
			},
			drawCircle : function(p, c) {
				//canvas API
				context.fillStyle = c.render();
				context.beginPath();
				context.arc(p.x, p.y, p.z, 0, 2 * Math.PI, true);
				context.closePath();
				context.fill();
			}
		}	
}());



/*
S.UI
  	@function timedAction   //执行指令动画
  		@parama fn             //回调函数
  		@parama delay       //动画执行时间
  		@parama max        //动画数量
  		@parama reverse   //动画反转
  	@function performAction   //渲染指令
*/
S.UI = (function() {
	var input = document.querySelector('.ui-input'),
		ui = document.querySelector('.ui');

	var sequence = [],
		currentAction,
		cmd = '#',
		interval,
		fristAction = true;

	function timedAction(fn, delay, max, reverse) {
		// clearInterval(interval);
		currentAction = 1;
		fn();

		if(!max || (!reverse && currentAction < max)) {
			interval = setInterval(function() {
				currentAction = currentAction + 1;
				fn();

				if((!reverse && max && currentAction ===max) || (reverse && currentAction === 0)) {
					clearInterval(interval);
				}
			}, delay);
		}
	}

	function performAction(value) {
		sequence = sequence.concat(value.split('|'));
		//将初始化传入的值转换为数组，并生成相关图像
		timedAction(function(index) {
			current = sequence.shift();

			S.Shape.switchShape(S.ShapeBuilder.letter(current[0] === cmd ? 'What?' : current));
		}, 2300, sequence.length);
	}

	function reset(destroy) {
            clearInterval(interval);
            sequence = [];
            destroy && S.Shape.switchShape(S.ShapeBuilder.letter(''));
      }

	function checkInputWidth(e) {
		if(input.value.length > 18) {
			ui.classList.add('ui--wide');
		} else {
			ui.classList.remove('ui--wide');
		}
	}

	function bindEvents() {
		document.body.addEventListener('keydown', function(e) {
			input.focus();

			if(e.keyCode === 13) {
				fristAction = false;
				reset();
				performAction(input.value);
				input.value = '';
			}
		})

		input.addEventListener('input', checkInputWidth);
            	input.addEventListener('change', checkInputWidth);
            	input.addEventListener('focus', checkInputWidth);
	}

	function init() {
		bindEvents();
		input.focus();
	}

	init();

	return {
		simulate : function(action) {
			performAction(action);
		}
	}

}());

S.Point = function(args) {
	this.x = args.x;
	this.y = args.y;
	this.z = args.z;
	this.a = args.a;
	this.h = args.h;
};

S.Color = function(r, g, b, a) {
	this.r = r;
	this.g = g;
	this.b = b;
	this.a = a;
}
S.Color.prototype = {
	render : function() {
		return 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' +this.a + ')';
	}
};


/*
S.Dot
  	@parama p   //初始粒子
     	 	p.x     //positionX
      		p.y     //positionY
      		p.z     //半径
      		p.a     //opacity
      		p.h     //持续时间
  	@parama e      //粒子速度变化系数
  	@parama s      //粒子游动
  	@parama q      //目标粒子
  	@parama t       //移动后粒子
*/
S.Dot = function(x, y) {
	this. p = {
		x : x,
		y : y,
		z : 5,
		a : 1,
		h : 0
	}

	this.e = 0.17;
	this.s = true;

	this.c = new S.Color(255, 255, 255, this.p.a);
	this.t = this.clone();
	this.q = [];
};
/*
S.Dot.prototype
  	@function _draw          //在canvas仲渲染dots
  	@function distance      //计算粒子目标位置与当前位置的距离
  	@function moveTowards      //粒子当前状态，移动或者线性增大
  	@function _update       //更新粒子位置
  	@function move           //存放粒子目标位置数据
*/
S.Dot.prototype = {
	clone : function() {
		return new S.Point({
			x : this.x,
			y : this.y,
			z : this.z,
			a : this.a,
			h : this.h
		})
	},
	_draw : function() {
		this.c.a = this.p.a;
		S.Drawing.drawCircle(this.p, this.c);
	},
	distanceTo : function(n, details) {
		//|AB| 等于 a * a + b * b开平方，两点之间距离公式
		var dx = this.p.x - n.x,
			dy = this.p.y - n.y,
			d = Math.sqrt(dx * dx + dy * dy);

		return [dx, dy, d];
	},
	_moveTowards : function(n) {
		var details = this.distanceTo(n, true);
		var dx = details[0],
			dy = details[1],
			d = details[2];

		//判断两点距离是否需要移动
		if(d > 1) {
			this.p.x -= (dx * this.e);
			this.p.y -= (dy * this.e);
		}else {
			if(this.p.h > 0) {
				this.p.h--;
			}else {
				return true;
			}
		}

		return false;
	},
	_update : function() {
		if(this._moveTowards(this.t)) {
			//取出目标粒子
			var p = this.q.shift();

			if(p) {
				//粒子移动
				this.t.x = p.x || this.p.x;
				this.t.y = p.y || this.p.y;
				this.t.z = p.z || this.p.z;
				this.t.a = p.a || this.p.a;
				this.p.h = p.h || 0;
			}else {
				// 粒子震动和漫游
				if(this.s) {
					this.p.x -= Math.random() * 1;
					this.p.y -= Math.random() * 1;
				}else {
					this.move(new S.Point({
						x : this.p.x + (Math.random() * 50) - 25,
						y : this.p.y + (Math.random() * 50) - 25
					}));
				}
			}
		}
		 // 按需要调整粒子 透明度和半径
		d = this.p.a - this.t.a;
		this.p.a = Math.max(0.1, this.p.a - (d * 0.05));
		d = this.p.z - this.t.z;
		this.p.z = Math.max(1, this.p.z - (d * 0.05));
	},

	move : function(p, avoidStatic) {
		if(!avoidStatic || (avoidStatic && this.distanceTo(p) > 1)) {
			this.q.push(p);
		}
	},

	render : function() {
		this._update();
		this._draw();
	}
}

/*
S.ShapeBuilder
  	@parama gap          //粒子间间隔

  	@function processCanvas    //返回需要渲染的位置数组
  	@function moveTowards      //粒子当前状态，移动或者线性增大
  	@function letter                     //创建需要渲染的图形
*/
S.ShapeBuilder = (function() {
	var gap = 13;
	var shapeCanvas = document.createElement("canvas");
	var shapeContext = shapeCanvas.getContext('2d');
	var fontSize = 500;
	var fontFamily = 'Avenir, Helvetica Neue, Helvetica, Arial, sans-serif, 华文细黑, 微软雅黑';

	// 文字居中
	function fit() {
		shapeCanvas.width = Math.floor(window.innerWidth / gap) * gap;
		shapeCanvas.height = Math.floor(window.innerHeight / gap) * gap;
		shapeContext.fillStyle = 'red';
		shapeContext.textBaseline = 'middle';
		shapeContext.textAlign = 'center';
	}

	function setFontSize(s) {
		shapeContext.font = 'bold ' + s + 'px ' + fontFamily;
	}

	function init() {
		fit();
	}

	init();

	function processCanvas() {
		//getImageData, 获取画布中所有像素，返回一个数组，value > 0为有图形
		//每隔4个单位为一个像素点(rgba)，故数组长度为canvas.width * canvas.height * 4
		var pixels = shapeContext.getImageData(0, 0, shapeCanvas.width, shapeCanvas.height).data;
		var dots = [];
		var x = y = 0;

		for(var p = 0; p < pixels.length; p += (4 * gap)) {
			// 搜索每隔像素点尾部，value > 0确定渲染
			if(pixels[p + 3] > 0) {
				dots.push(new S.Point({
					x : x,
					y : y
				}));
			}

			//每隔gap长度插入一个点
			x += gap;

			//x到达canvas.width最大值时候，x重置，y向下移动
			//p += gap * 4 * shapeCanvas.width;为在新行循环
			if(x >= shapeCanvas.width) {
				x = 0;
				y += gap;
				p += gap * 4 * shapeCanvas.width;
			}
		}
		return {
			dots : dots
		}
	}

	return {
		letter : function(l) {
			var s = 0;
			//Canvas API
			setFontSize(fontSize);
                   	s = Math.min(fontSize, shapeCanvas.width / shapeContext.measureText(l).width * fontSize * 0.8, shapeCanvas.height * 0.45);
                   	setFontSize(s);
                   	shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
                   	// 填充文字，并且居中
                   	shapeContext.fillText(l, shapeCanvas.width / 2, shapeCanvas.height / 2);

			return processCanvas();
		}
	}
}());


/*
S.ShapeBuilder
  	@function switchShape        //改变图形，更新粒子状态
*/
S.Shape = (function() {
	var dots = [];

	return {
		switchShape : function(n, fast) {
			var size, a = S.Drawing.getArea();
			if(n.dots.length > dots.length) {
				//获取图形返回数组长度，并减去旧图形数组长度
				size = n.dots.length - dots.length;
				for(var i = 0; i < size; i++) {
					dots.push(new S.Dot(a.w / 2, a.h / 2));
				}
			}

			var d = i = 0;
			//此处实现目标粒子随机装入数组中，实现随机移动效果
			while(n.dots.length > 0) {
				i = Math.floor(Math.random() * n.dots.length);
				dots[d].e = 0.14;

				if(dots[d].s) {
					dots[d].move(new S.Point({
						z : Math.random() * 20 + 10,
						a : Math.random(),
						h : 18
					}));
				}

				// 粒子游动取消
				dots[d].s = true;

				dots[d].move(new S.Point({
					x : n.dots[i].x,
					y : n.dots[i].y,
					z : 5,
					a : 1,
					h : 0
				}));

				n.dots = n.dots.slice(0, i).concat(n.dots.slice(i + 1));
				d++;
			}

			//粒子分散游动
			for(var i = d; i < dots.length; i++) {
				if(dots[i].s) {
					dots[i].move(new S.Point({
						z : Math.random() * 20 + 10,
						a : Math.random(),
						h : 30
					}));

					dots[i].s = false;
					dots[i].e = 0.04;

					dots[i].move({
						x : Math.random() * a.w,
						y : Math.random() * a.h,
						a : 0.3,
						z : Math.random() * 4,
						h : 0
					});
				}
			}
		},
		render : function() {
			for(var d = 0; d < dots.length; d++) {
				dots[d].render();
			}
		}
	}
}());

S.init();