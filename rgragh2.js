/**
*	重新来过
*/
(function(){
	//Raphael plugins
	(!Raphael.fn.arrow) && (Raphael.fn.arrow=function(from,to){
		var line=null,triangle=null;
		if(from.from && from.to && from.triangle && from.line){
			to = from.to;
			triangle= from.triangle;
			line = from.line;
			from = from.from;
		}
		//adjustx:在IE下getBBox获取的坐标没有算上_viewBox中的部分。
		//直接访问_viewBox不是好的做法，但是Raphael并没有提供接口访问该属性
		//椭圆对象getBBox()在IE下xy坐标有问题
		var bbfrom = from.getBBox(),bbto= to.getBBox(),adjustx=(document.all?(this._viewBox||[0,0])[0]:0),adjusty=(document.all?(this._viewBox||[0,0])[1]:0),
			fromx=((from.type=="ellipse" && document.all)?from.attr("cx"):bbfrom.x+adjustx+bbfrom.width/2),
			fromy=((from.type=="ellipse" && document.all)?from.attr("cy")+bbfrom.height/2:bbfrom.y+adjusty+bbfrom.height),
			tox=((to.type=="ellipse" && document.all)?to.attr("cx"):bbto.x+adjustx+bbto.width/2),
			toy= ((to.type=="ellipse" && document.all)?to.attr("cy")-bbto.height/2:bbto.y+adjusty),
			c=(tox==fromx)?Math.PI/2:Math.atan((toy-fromy)/(tox-fromx)),
			sign=(tox==fromx)?1:((tox-fromx)/Math.abs(tox-fromx)),
			triangleX1= (tox-Math.cos(c-Math.PI/12)*15*sign).toFixed(1),
			triangleY1= (toy-Math.sin(c-Math.PI/12)*15*sign).toFixed(1),
			triangleX2= (tox-Math.cos(c+Math.PI/12)*15*sign).toFixed(1),
			triangleY2= (toy-Math.sin(c+Math.PI/12)*15*sign).toFixed(1),
			pathstr="M"+tox+","+toy+" L"+triangleX1+","+triangleY1+" L"+triangleX2+","+triangleY2+" L"+tox+","+toy;
		if(!triangle){
			triangle = this.path(pathstr).attr({stroke: "#000",fill:"#f5f5f5","stroke-width":2}).toBack();
		}else{
			triangle.attr("path",pathstr).toBack();
		}
		if(!line){
			line= this.path("M"+fromx+","+fromy+" L"+tox+","+toy).toBack();
		}else{
			line.attr("path","M"+fromx+","+fromy+" L"+tox+","+toy).toBack();
		}
		line.attr({"stroke-width":2});
		return {from :from ,to:to,line:line,triangle:triangle};
	});
	
	//util methods
	var addEventListener=document.all?(function(ele,eventname,fn){ele.attachEvent("on"+eventname,fn);}):(function(ele,eventname,fn){ele.addEventListener(eventname,fn,false)}),
		getEvent=function(e){
			var evt = window.event?window.event:e;
			(!evt.stopPropagation) && (evt.stopPropagation=function(){evt.cancelBubble=false;});
			(!evt.preventDefault) && (evt.preventDefault= function(){evt.returnValue=false;});
			(!evt.target) && (evt.target= evt.srcElement);
			(!evt.which) && (e.which= e.button);
			return evt;
		};
	
	RGraph=function (element){
		this.c=element.nodeType?element:document.getElementById(element);
		this.paper= Raphael(this.c,this.width,this.height);
		this.gridsize={w:180,h:100};//每个节点的宽高
		this.reset();
		this._bindCanvas();

		//for test
		var e1=this.paper.ellipse(20,-15,80,30),
			e2=this.paper.ellipse(200,130,80,30),
			e3=this.paper.ellipse(800,630,80,30);
		this.paper.arrow(e1,e2);
		this.paper.arrow(e2,e3);
		

	}

	RGraph.prototype={
		loadData:function(data,startNodes){
			(!startNodes) && (startNodes=[]);
			(typeof(startNodes)=="string") && (startNodes=[startNodes]);
			if(!startNodes){
				for(var nodeid in data){
					(!data[nodeid].up)  && (data.up=[]);
					(!data[nodeid].down) && (data.down=[]);
					if(data[nodeid].up.length==0) startNodes.push(nodeid);
				}
			}
			debugger;
			var me=this;
			me.data=data;
		},
		reset:function(){
			this.data={};
			this.zoom=1;//放大倍数
			this.setViewBox(0,0,this.c.clientWidth,this.c.clientHeight);
		},
		clear:function(){
			this.paper.clear();
		},
		_bindCanvas:function(){
			var me=this,c =me.c;
			//wheel event
			function wheel(e){
				var evt = getEvent(e),viewbox=me.getViewBox(),delta = evt.wheelDelta?(evt.wheelDelta/120):(-evt.detail/3),
					basePoint={x:viewbox.x+evt.clientX,y:viewbox.y+evt.clientY};
				me.setZoom(me.getZoom()*(1+delta*0.1),basePoint);
				evt.stopPropagation();
				evt.preventDefault();
				return false;
			} 
			try{
				addEventListener(c,"mousewheel",wheel);//IE+webkit
				addEventListener(c,"DOMMouseScroll",wheel);//firefox
			}catch(e){}

			//drag event
			addEventListener(c,"mousedown",function(e){
				var evt = getEvent(e);
				if(e.which!=1) return ;//非右键无效
				if(evt.target.parentNode==c){//拖动canvas
					me.canvasdragging={x:evt.clientX,y:evt.clientY};
					c.style.cursor="move";
				}
				
			});
			addEventListener(c,"mousemove",function(e){
				var evt = getEvent(e);
				me.clearSelection();
				if(me.canvasdragging){
					var x = parseInt((me.canvasdragging.x-evt.clientX)/me.zoom),
						y = parseInt((me.canvasdragging.y-evt.clientY)/me.zoom),
						viewbox = me.getViewBox();
					me.canvasdragging={x:evt.clientX,y:evt.clientY};
					me.setViewBox(viewbox.x+x,viewbox.y+y,viewbox.w,viewbox.h);
				}

			});
			addEventListener(c,"mouseup",function(e){
				var evt = getEvent(e);
				me.clearSelection();
				if(me.canvasdragging){
					me.canvasdragging=false;
					c.style.cursor="auto";
				}
				
			});
		},
		//拖拽过程容易产生选中，清除选中对象
		clearSelection:function(){
			if (window.getSelection) {
				if (window.getSelection().empty) {  // Chrome
					window.getSelection().empty();
				} else if (window.getSelection().removeAllRanges) {  // Firefox
					window.getSelection().removeAllRanges();
				}
			} else if (document.selection) {  // IE?
				document.selection.empty();
			}
		},
		setZoom:function(zoom,basePoint){
			var me=this,viewbox=me.getViewBox();
			if(!basePoint){
				basePoint  = {x:viewbox.x+viewbox.w/2,y:viewbox.y+viewbox.h/2};
			}
			viewbox.x +=parseInt((basePoint.x-viewbox.x)*(1/me.zoom-1/zoom));
			viewbox.y +=parseInt((basePoint.y-viewbox.y)*(1/me.zoom-1/zoom));
			me.zoom= zoom;
			viewbox.w=parseInt(me.paper.width/me.zoom);
			viewbox.h=parseInt(me.paper.height/me.zoom);
			me.setViewBox(viewbox.x,viewbox.y,viewbox.w,viewbox.h);
		},
		getZoom:function(){return this.zoom;},
		setViewBox:function(x,y,w,h){
			var me=this;
			me.paper.setViewBox(x,y,w,h,true);
			me.x=x;
			me.y=y;
			me.w=w;
			me.h=h;
			//console.log("x:"+me.x+" y:"+me.y+" w:"+me.w+" h:"+me.h+" zoom:"+me.zoom);
		},
		getViewBox:function(){
			return {x:this.x,y:this.y,w:this.w,h:this.h};
		},
		test:function(){
		
		}
	};

})();