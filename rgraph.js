//Raphael��arrow��չ
Raphael.fn.arrow=function(from,to){
	var line=null,triangle=null;
	if(from.from && from.to && from.triangle && from.line){
		to = from.to;
		triangle= from.triangle;
		line = from.line;
		from = from.from;
	}
	//adjustx:��IE��getBBox��ȡ������û������_viewBox�еĲ��֡�
	//ֱ�ӷ���_viewBox���Ǻõ�����������Raphael��û���ṩ�ӿڷ��ʸ�����
	//��Բ����getBBox()��IE��xy����������
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
	
}


/**
*	DepencyGraph: ����ͼ
*/
var DepencyGraph = function(element){
	
	this.c= baidu.g(element);
	this.width= this.c.clientWidth;
	this.height = this.c.clientHeight;
	this.centerPointer= {x:5000-this.width/2,y:5000-this.height/2};//ͼ�ε����ĵ��canvas����(�ɱ�)
	this.rootPoint = {x:5000-this.width/2,y:5000-this.height/2};//��������
	this.paper= Raphael(this.c,10000,10000) ;
	this.gridsize={w:180,h:100};//ÿ���ڵ�Ŀ��
	this.data={};
	this.pos={};//��¼�ڵ��λ��
	this.lastpos={};//��¼�ϴνڵ��λ��
	this.zoom=1;//�Ŵ���
	this.paper.setViewBox(this.centerPointer.x,this.centerPointer.y,10000,10000,true);

	var me=this,c =me.c,zoom=this.zoom,canvasdragging= false,nodedragging=false,newup=false;
    //wheel event
    function wheel(e){
        var evt = baidu.event.get(e),delta = evt.wheelDelta?(evt.wheelDelta/120):(-evt.detail/3),basePoint={x:me.centerPointer.x+evt.clientX,y:me.centerPointer.y+evt.clientY};
        me.setZoom(me.getZoom()*(1+delta*0.1),basePoint);
        evt.stopPropagation();
        evt.preventDefault();
        return false;
    } 
    try{
        baidu.event.on(c,"mousewheel",wheel);//IE+webkit
        baidu.event.on(c,"DOMMouseScroll",wheel);//firefox
    }catch(e){}
    //drag event
	baidu.event.on(c,"mousedown",function(e){
		var evt = baidu.event.get(e),drag = false;
        if(!e.which) e.which= e.button;//ie button ,other which
        if(e.which!=1) return ;//���Ҽ���Ч
		if(evt.target.parentNode.id==me.c.id){//�϶�canvas
			canvasdragging={x:evt.clientX,y:evt.clientY};
			me.c.style.cursor="move";
		}else{
			var node = me.paper.getElementByPoint(evt.clientX,evt.clientY);
			if(null!= node && node.data("taskid")){//�϶��ڵ�
				var nodeid = node.data("taskid"),nodedata = me.data[nodeid],c=nodedata._c;
				if(!evt.shiftKey){
					nodedragging={x:evt.clientX,y:evt.clientY,nodeid:nodeid,_x:evt.clientX,_y:evt.clientY};
					me.paper.getById(c.r).attr({"cursor":"move"}).toFront();
					me.paper.getById(c.t).attr({"cursor":"move"}).toFront();
				}else{//shift+�϶��ڵ㣬���������ϵ
					newup={x:(me.centerPointer.x+evt.clientX/me.zoom)-1,y:(me.centerPointer.y+evt.clientY/me.zoom)-1};
					if(document.all){
						var innercanvas = me.c.childNodes[0],left=parseInt(baidu.dom.getStyle(innercanvas,"left"),10),top= parseInt(baidu.dom.getStyle(innercanvas,"top"),10);
						newup.x= (evt.clientX/me.zoom-left)-1;
						newup.y= (evt.clientY/me.zoom-top)-1;
					}
					var arrow = me.paper.arrow(me.paper.getById(c.r),{getBBox:function(){
						return {width:0,height:0,x:newup.x,y:newup.y}
					}});
					arrow.line.toFront().attr({"stroke":"#0f0","fill":"#0f0"});
					arrow.triangle.toFront().attr({"stroke":"#0f0","fill":"#0f0"});
					newup.fromNodeId = nodeid;
					newup.arrow = arrow;
				}
			}
		}
		
	});
	baidu.event.on(c,"mousemove",function(e){
		var evt = baidu.event.get(e),hovernode = me.paper.getElementByPoint(evt.clientX,evt.clientY);
		me.clearSelection();
		if(canvasdragging){
			if(!document.all){
				var x = (canvasdragging.x-evt.clientX),
					y = (canvasdragging.y-evt.clientY);
				canvasdragging={x:evt.clientX,y:evt.clientY};
				me.centerPointer.x +=(x/me.zoom);
				me.centerPointer.y +=(y/me.zoom);
				me.setViewBox(me.centerPointer.x,me.centerPointer.y,10000/me.zoom,10000/me.zoom,true);
			}
		}
		if(nodedragging){
			var x = (nodedragging.x-evt.clientX),
				y = (nodedragging.y-evt.clientY),
				node = me.data[nodedragging.nodeid],c=node._c,
				r = me.paper.getById(c.r),
				t= me.paper.getById(c.t);
			delete me.pos[c.x+"|"+c.y];
			c.x -=(x);
			c.y-=(y);
			nodedragging.x= evt.clientX;
			nodedragging.y= evt.clientY;
			r.type=="rect"?(r.attr({x:c.x-70,y:c.y-40})):(r.attr({cx:c.x,cy:c.y-15,x:c.x,y:c.y-15}));
			t.attr({x:c.x,y:c.y-15});

			me.pos[c.x+"|"+c.y]= nodedragging.nodeid;

			for (var i=0,l=(c.down||[]).length;i<l ;i++ ){
				me.paper.arrow(c.down[i]);
			}
			
			for (var i=0,l=(c.up||[]).length;i<l ;i++ ){
				me.paper.arrow(c.up[i]);
			}
		}
		//shift+�϶��ڵ� �������
		if(evt.shiftKey){
			if(newup){//���϶�
				newup.x= (me.centerPointer.x+evt.clientX/me.zoom)-1;
				newup.y= (me.centerPointer.y+evt.clientY/me.zoom)-1;
				if(document.all){
						var innercanvas = me.c.childNodes[0],left=parseInt(baidu.dom.getStyle(innercanvas,"left"),10),top= parseInt(baidu.dom.getStyle(innercanvas,"top"),10);
						newup.x= ((evt.clientX/me.zoom-left))-1;
						newup.y= ((evt.clientY/me.zoom-top))-1;
					}
				me.paper.arrow(newup.arrow);
				//�϶����������һЩУ����û���Ӧ
				if(!hovernode && newup._coloredObjs && newup._coloredObjs.length){//û��hover�ڽڵ��ϣ�������֮ǰ��ɫ�Ľڵ㣬Ӧ��ȥ����Щ��ɫ�ڵ�
						me.common(newup._coloredObjs);
						newup._hoverNodeId=null;
						newup._coloredObjs=null;
				}
				if(hovernode  && hovernode.data("taskid")){
					var hoverNodeId = hovernode.data("taskid"),hoverNode = me.data[hoverNodeId];
					
					if(hoverNodeId!=newup.fromNodeId && hoverNodeId!=newup._hoverNodeId){//��fromNode�ϣ�����ɫ ���ϴ�hover�ڵ�һ��Ҳ�����¼��
						//ȥ��֮ǰ��ɫ�ĵ�
						if(newup._coloredObjs && newup._coloredObjs.length){//û��hover�ڽڵ��ϣ�������֮ǰ��ɫ�Ľڵ㣬Ӧ��ȥ����Щ��ɫ�ڵ�
								me.common(newup._coloredObjs);
								newup._coloredObjs=null;
						}
						//���ܽ���������ϵ�Ľڵ���ɫ
						var arr= [newup.fromNodeId],currentIndex =0,isvalid=true,coloredObjs=[],pushedNodes={};
						pushedNodes[newup.fromNodeId]=true;
						while(currentIndex<arr.length){
							var nodeId = arr[currentIndex],node = me.data[nodeId],noded = node.up||[];
							if(noded.length){
								for (var i=0,l=noded.length;i<l ;i++ ){
									var did = noded[i].id,dnode= me.data[did];
									if(!pushedNodes[did]){
										arr.push(did);
										pushedNodes[did]=true;
									}
									if(did==hoverNodeId){
										isvalid=false;
										//TODO:��ʱarr�в����Ǵ�fromNodeId��did��·��,����û�з����ԣ�arr�кܶ���Ϊ��̽push�ĵ�
										//console.log(arr);
										currentIndex= arr.length;//ֹͣѭ�����ѭ��
										break;//ֹͣѭ��
									}
								}
							}
							currentIndex++;
						}
						if(!isvalid){
							for (var i=arr.length-1;i>=0 ;i-- ){
								var chainNode = me.data[arr[i]],cnc=chainNode._c,nextNode=me.data[arr[i-1]];
								coloredObjs.push(me.paper.getById(cnc.r));
								if(i!=0){
									for (var ii=0,l=(chainNode.down||[]).length;ii<l ;ii++ ){
										if(chainNode.down[ii]==nextNode.taskid){
											var arrow = cnc.down[ii];
											coloredObjs.push(arrow.line,arrow.triangle);
										}
									}
								}
							}
							coloredObjs.push(newup.arrow.line,newup.arrow.triangle);
							me.yellow(coloredObjs);
						}else{
							//����hovernode����fromNode���ӽڵ�(��������ϵ�Ѿ�����)
							var depencyExist =false,fromNode =me.data[newup.fromNodeId], fromNodeDown = fromNode.down||[];
							for (var i=0,l=fromNodeDown.length;i<l ;i++ ){
								if(fromNodeDown[i]==hoverNodeId){
									depencyExist=true;
									var arrow = fromNode._c.down[i];
									coloredObjs=[arrow.line,arrow.triangle];
									me.yellow(coloredObjs);
									break;
								}
							}
							
							if(!depencyExist){
								//�ɷ���
								coloredObjs=[newup.arrow.line,newup.arrow.triangle,me.paper.getById(hoverNode._c.r)];
								me.green(coloredObjs);
							}
						}
						
						//��¼��newup
						newup._coloredObjs=coloredObjs;
						newup._hoverNodeId=hoverNodeId;
					}//end if(hoverNodeId!=newup.fromNodeId)
					newup.arrow.line.toFront();
					newup.arrow.triangle.toFront();	
				}//end  if(hovernode  && hovernode.data("taskid"))
				
			}
		}else if(newup){//�϶�������ȡ���϶�	
			if(newup._coloredObjs && newup._coloredObjs.length){//ȥ��֮ǰ��ɫ�ڵ�
				me.common(newup._coloredObjs);
				newup._coloredObjs=null;
			}
			newup.arrow.line.remove();
			newup.arrow.triangle.remove();
			newup = false;
		}
		
		
		//�����ڽڵ��ϣ������ڵ����صļ�ͷ
		//�ų�������Ϊ
		if(canvasdragging || nodedragging || evt.shiftKey || newup) {return  ;}
		if(hovernode && hovernode.data("taskid")){
			var taskid= hovernode.data("taskid"),hovernode =me.data[taskid];
			(!hovernode._c.up) && (hovernode._c.up=[]);
			if(me._lastHoverNode!=taskid){//����node
				if(me._lastHoverNode &&  me.data[me._lastHoverNode]){
					var lastnode = me.data[me._lastHoverNode],arr=[];
					for (var i=0,l=lastnode._c.down.length;i<l ;i++ ){
						lastnode._c.down[i].line.toBack();
						lastnode._c.down[i].triangle.toBack();
						arr.push(lastnode._c.down[i].line,lastnode._c.down[i].triangle);
					}
					for (var i=0,l=lastnode._c.up.length;i<l ;i++ ){
						lastnode._c.up[i].line.toBack();
						lastnode._c.up[i].triangle.toBack();
						arr.push(lastnode._c.up[i].line,lastnode._c.up[i].triangle);
					}
					arr.push(me.paper.getById(lastnode._c.r));
					me.common(arr);
				}
				var node = me.data[taskid],arr=[];
					for (var i=0,l=node._c.down.length;i<l ;i++ ){
						node._c.down[i].line.toFront();
						node._c.down[i].triangle.toFront();
						arr.push(node._c.down[i].line,node._c.down[i].triangle);
					}
					for (var i=0,l=node._c.up.length;i<l ;i++ ){
						node._c.up[i].line.toFront();
						node._c.up[i].triangle.toFront();
						arr.push(node._c.up[i].line,node._c.up[i].triangle);
					}
					arr.push(me.paper.getById(node._c.r));
					me.yellow(arr);
				
			}
			me._lastHoverNode = taskid;
		}else{
			if(me._lastHoverNode &&  me.data[me._lastHoverNode]){
				var lastnode = me.data[me._lastHoverNode],arr=[];
				for (var i=0,l=lastnode._c.down.length;i<l ;i++ ){
					lastnode._c.down[i].line.toBack();
					lastnode._c.down[i].triangle.toBack();
					arr.push(lastnode._c.down[i].line,lastnode._c.down[i].triangle);
				}
				for (var i=0,l=lastnode._c.up.length;i<l ;i++ ){
					lastnode._c.up[i].line.toBack();
					lastnode._c.up[i].triangle.toBack();
					arr.push(lastnode._c.up[i].line,lastnode._c.up[i].triangle);
				}
				arr.push(me.paper.getById(lastnode._c.r));
				me.common(arr);
			}
			me._lastHoverNode=null;
		}

	});
	baidu.event.on(c,"mouseup",function(e){
		var evt = baidu.event.get(e);
		me.clearSelection();
		if(canvasdragging){
			if(document.all){
				var x = (canvasdragging.x-evt.clientX),
					y = (canvasdragging.y-evt.clientY),
					viewBox  = me.paper._viewBox;
				me.centerPointer.x +=(x/me.zoom);
				me.centerPointer.y +=(y/me.zoom);  
				x= me.centerPointer.x-me.rootPoint.x;
				y= me.centerPointer.y-me.rootPoint.y;
				me.setViewBox(x/me.zoom,y/me.zoom,10000/me.zoom,10000/me.zoom,true);
			}
			canvasdragging=false;
			me.c.style.cursor="auto";
            me.persist();
		}

		if(nodedragging){
			var node = me.data[nodedragging.nodeid],c=node._c,r = me.paper.getById(c.r);
			me.paper.getById(c.r).attr({"cursor":"pointer"});
			me.paper.getById(c.t).attr({"cursor":"pointer"});
			if(nodedragging.x==nodedragging._x && nodedragging.y==nodedragging._y){//���û���϶�λ�ã�˵���ǵ��
				if(typeof(me.onnodeclick)=="function") me.onnodeclick.call(me,node);
			}
			nodedragging = false;
            me.persist();
		}

		if(newup){//�϶����
			if(newup._coloredObjs && newup._coloredObjs.length){//ȥ��֮ǰ��ɫ�ڵ�
				me.common(newup._coloredObjs);
				newup._coloredObjs=null;
			}
			newup.arrow.line.remove();
			newup.arrow.triangle.remove();
			if(newup._hoverNodeId){
				var result = me.addDepency(newup.fromNodeId,newup._hoverNodeId);
				//����0:�ɹ�,1:fromNodeId,toNodeId������,2:fromNodeId->toNodeId���ܽ���������ϵ,3:������ϵ�Ѿ�����
				var msg={"0":"��������ɹ�","2":"���ܽ���������ϵ","3":"��������ϵ�Ѿ�����"}[result];
				alert(msg);
			}
			newup = false;
		}
		
	});
}

DepencyGraph.prototype= {
	yellow:function(obj){
		var me =this;
		if(!obj.length){
			if(!obj._stroke){
				obj._stroke=obj.attr("stroke");
				obj._fill=obj.attr("fill");
			}
			obj.attr({"stroke":"#FF9900",fill:"#FFFF66"});
		}else{
			for (var i=0,l=obj.length; i<l; i++){
				var o = obj[i];
				me.yellow(o);
			}
		}
	},
	green:function(obj){
		var me = this;
		if(!obj.length){
			if(!obj._stroke){
				obj._stroke=obj.attr("stroke");
				obj._fill=obj.attr("fill");
			}
			obj.attr({"stroke":"#669900",fill:"#CCFF66"});
		}else{
			for (var i=0,l=obj.length; i<l; i++){
				var o = obj[i];
				me.green(o);
			}
		}
	},
	common:function(obj){
		var me = this;
		if(!obj.length){
			if(obj._stroke){
				obj.attr("stroke",obj._stroke);
				obj.attr("fill",obj._fill);
			}else{
				obj.attr({"stroke":"#000",fill:"#f5f5f5"});
			}
		}else{
			for (var i=0,l=obj.length; i<l; i++){
				var o = obj[i];
				me.common(o);
			}
		}
	},
	//��ק�������ײ���ѡ�У����ѡ�ж���
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
	setViewBox:function(x,y,w,h,fit){
		var me =this;
		if(document.all){
			var innercanvas= me.c.childNodes[0],zoom = 10000/w,left= parseInt(baidu.dom.getStyle(innercanvas,"left"),10),top= parseInt(baidu.dom.getStyle(innercanvas,"top"),10);
			innercanvas.style.left=((/*me.rootPoint.x-*/0-x)+"px");
			innercanvas.style.top=((/*me.rootPoint.y-*/0-y)+"px");
			innercanvas.style.zoom=zoom;
		}else{
			return me.paper.setViewBox(x,y,w,h,fit);
		}
	},
	getZoom:function(){return this.zoom;},
	reset:function(){
        var me = this;
        me.centerPointer.x= me.rootPoint.x;
        me.centerPointer.y= me.rootPoint.y;
        me.zoom=1;
        me.setZoom(1);
    },
	setZoom:function(zoom,basePoint){
		var me=this;
        if(!basePoint){
            basePoint  = {x:me.centerPointer.x+me.c.offsetWidth/2,y:me.centerPointer.y+me.c.offsetHeight/2};
        }
        me.centerPointer.x +=(basePoint.x-me.centerPointer.x)*(1/me.zoom-1/zoom);
        me.centerPointer.y +=(basePoint.y-me.centerPointer.y)*(1/me.zoom-1/zoom);
		me.zoom= zoom;
		if(document.all){
			me.setViewBox(this.centerPointer.x-this.rootPoint.x,this.centerPointer.y-this.centerPointer.y,10000/zoom,10000/zoom,true);
		}else{
			me.setViewBox(this.centerPointer.x,this.centerPointer.y,10000/zoom,10000/zoom,true);
		}
        me.persist();
	},
	//���������Ƿ����
	isFree:function (p,offset){
		var me = this,result=true;
		if(me.pos[(p.x+"|"+p.y)]) return false;
		offset= offset||{x:me.gridsize.w/2,y:me.gridsize.h/2};
		for(var co in me.pos){
			var arrco = co.split("|"),cox =parseInt(arrco[0],10),coy=parseInt(arrco[1],10); 
			if(Math.abs(cox-p.x)<offset.x  && Math.abs(coy-p.y)<offset.y){
				result=false;
				break;
			}
		}
		return result;
		
	},
	//��ȡ���õ�λ��
	getFreePos:function (p){
		var me = this,w=me.gridsize.w,h=me.gridsize.h, arr=[[p.x,p.y+h],[p.x+w,p.y+h],[p.x-w,p.y+h],[p.x,p.y+2*h],[p.x+w,p.y+2*h],[p.x-w,p.y+2*h],[p.x+2*w,p.y+2*h],[p.x-2*w,p.y+2*h],[p.x,p.y+3*h],[p.x+w,p.y+3*h],[p.x-w,p.y+3*h],[p.x+2*w,p.y+3*h],[p.x-2*w,p.y+3*h],[p.x+3*w,p.y+3*h],[p.x-3*w,p.y+3*h],[p.x,p.y+4*h],[p.x+w,p.y+4*h],[p.x-w,p.y+4*h],[p.x+2*w,p.y+4*h],[p.x-2*w,p.y+4*h],[p.x+3*w,p.y+4*h],[p.x-3*w,p.y+4*h],[p.x+4*w,p.y+4*h],[p.x-4*w,p.y+4*h]];
		if(me.isFree(p)){return p;}
		for (var i=0,l=arr.length; i<l; i++){
			var p2try ={x:arr[i][0],y:arr[i][1]};
			if(me.isFree(p2try)){
				return {x:p2try.x+parseInt(Math.random()*20-10),y:p2try.y};
			}
		}
		//û�ҵ����ֵ
		return {x:p.x+Math.random()*1000,y:p.y+Math.random()*1000};
	},
	//��ȡˮƽ�����ϵĿյ�
	getHorizontalFreePos:function (p,offset){
		var me = this,w=me.gridsize.w,h=me.gridsize.h;
		offset = offset|| w*2.5;
		if(me.isFree(p)){return p;}
		for (var i=0,l=101; i<l; i++){
			var p2try ={x:p.x+i*offset,y:p.y};
			if(me.isFree(p2try)){
				return p2try;
			}
		}
		//û�ҵ����ֵ
		return {x:p.x+Math.random()*1000,y:p.y+Math.random()*1000};
	},
	//���϶��µı�������
	travelfromtop:function (data,fn){
		var me = this;
		//topnodes :û�����εĽڵ�
		var topnodes =[];
		for (var nodeid in data){
			if(!data[nodeid].up || (data[nodeid].up.length==0)) topnodes.push(nodeid);
		}
		
		var foundedNodes ={};
		for (var i=0,l=topnodes.length; i<l; i++){
			var topnodeid = topnodes[i],topnode = data[topnodeid],arr=[],currentIndex =0,currentLevel=0,levelstatuses={0:true};
			foundedNodes[topnodeid]=true;
			arr.push(topnodeid);
			if(fn(topnode)===false)  return ;
			while(currentIndex < arr.length){
				var node = data[arr[currentIndex]],c = node.down||[];
				for (var ii=0,ll=c.length; ii<ll; ii++){
					var nodeid = c[ii],node = data[nodeid],existInPreviousChildren=false;
					if(!foundedNodes[nodeid]){
						arr.push(nodeid);
						foundedNodes[nodeid]=true;
						if(fn(node)===false)  return ;
					}
				}
				currentIndex ++;
			}

		}
		
	},
	//����һ���ڵ�
	drawnode:function (p,node){
                 var me= this,r=(node.type=="time"?me.paper.ellipse(p.x,p.y-15,80,30):me.paper.rect(p.x-70,p.y-40,140,50,3)).attr({fill:(node.color||"#f8f8f8"),stroke:(node.color||"#000"),"cursor":"pointer"}),ellipsedName= node.name.length>8?(node.name.substr(0,7)+".."):node.name,
			t=me.paper.text(p.x,p.y-15,node.taskid+"("+ellipsedName+")\n "+node.runCondition+" \n "+node.lastRun).attr({color:"#f5f5f5","font-size":12,"cursor":"pointer"});
		r.data("taskid",node.taskid);//��taskid�浽rect��
		t.data("taskid",node.taskid);//��taskid�浽text��
        me.pos[p.x+"|"+p.y]=node.taskid;
        var highlightNodeIds = me.highlightNodeIds||[],highlight= baidu.array.indexOf(highlightNodeIds,node.taskid);
        if(highlight!=-1) {
            r.attr({"stroke":"#ff9900","stroke-width":3});
        }
		return {x:p.x,y:p.y,r:r.id,t:t.id};
	},
    persist:function(){
        var me=this,md5key =me.md5key;
        if(!md5key)return ;   
        var persistValue={zoom:me.zoom,centerPointer:me.centerPointer},pos={},posIsBlank=true;
        for(var nodeid in me.data){
            if(me.data[nodeid]._c) {
                pos[nodeid]= {x:me.data[nodeid]._c.x,y:me.data[nodeid]._c.y};
                posIsBlank=false;
            }
        }
        if(posIsBlank) return ;
        persistValue.lastpos = pos;
        persistValue  = baidu.json.stringify(persistValue);
        //console.log("persist : key :"+md5key+" value :"+persistValue);
        //baidu.cookie.set(md5key,persistValue);
    },
	//��������
	loadData:function(data){
		var me =this;
		me.data = data;
        me.zoom=1;
		me.paper.clear();
        me.centerPointer.x= me.rootPoint.x;
        me.centerPointer.y=me.rootPoint.y;
		delete me.pos;
		me.pos={};

        //cookie persist
        /*var md5key = hex_md5(baidu.json.stringify(data)),persistedValue = baidu.cookie.get(md5key);
        if(persistedValue) {
            persistedValue =  baidu.json.parse(persistedValue);
            baidu.object.extend(me,persistedValue);
        }
        me.md5key=md5key;
        me.setZoom(me.getZoom());*/

		me.travelfromtop(data,function(node){
			if(node.up.length==0){
				var p =me.lastpos[node.taskid]||me.getHorizontalFreePos({x:me.rootPoint.x+400,y:me.rootPoint.y+me.gridsize.h});
				node._c=me.drawnode(p,node);
			}else{
				for (var i=0,l=node.up.length; i<l; i++){
					var d = node.up[i].id,dnode =data[d];
					if(dnode._c){
						var p = me.lastpos[node.taskid]||me.getFreePos(dnode._c);
						node._c=me.drawnode(p,node);
						break;
					}
				}
			}
		});
		//����ͷ
		for (var nodeid in data){
			var node = data[nodeid],arrd=node.down||[],c=node._c;
			if(!c.down) c.down=[];
			if(!c.up) c.up=[];
			for (var i=0,l=arrd.length; i<l; i++){
				var cNodeId = arrd[i],cNode = data[cNodeId],cc= cNode._c,cuColor=false;
				var arrow = me.paper.arrow(me.paper.getById(c.r),me.paper.getById(cc.r));
				for (var ii=0,ll=cNode.up.length;ii<ll ;ii++ ){
					if(cNode.up[ii].id==nodeid){
						cuColor =cNode.up[ii].color; 
						break;
					}
				}
				if(cuColor){
					arrow.line.attr({fill:cuColor,stroke:cuColor});
					arrow.line._fill=cuColor;
					arrow.line._stroke=cuColor;
					arrow.triangle.attr({fill:cuColor,stroke:cuColor});
					arrow.triangle._fill=cuColor;
					arrow.triangle._stroke=cuColor;
				}
				c.down.push(arrow);
				if(!cc.up) cc.up =[];
				cc.up.push(arrow);
			}
		}
        me.persist();
	},
	//׷������
	appendData:function(data2append){
		//�Ȼ��
		var me=this,arr=[],data=me.data,currentIndex =0;
		for(var nodeid in data2append){
			var node = data2append[nodeid];
			if(node.up.length==0){//û��������,����ڵ�
				var p = me.getHorizontalFreePos({x:me.rootPoint.x+100,y:me.rootPoint.y+80});
				node._c=me.drawnode(p,node);
				data[nodeid]=node;
				arr.push(nodeid);
			}else{
				//������Ϊ�Ѿ����ڵĵ� 
				var upExists =false;
				for (var i=0,l=node.up.length;i<l ;i++ ){
					var did = node.up[i].id;
					if(data[did]) {upExists = did; break;}
				}
				if(upExists !==false){
					var dnode = data[upExists],p = me.getFreePos(dnode._c);
					node._c=me.drawnode(p,node);
					data[nodeid]=node;
					arr.push(nodeid);
				}
				//�������->���ε�ļ�ͷҲ����
				for (var i=0,l=node.up.length;i<l ;i++ ){
					var did = node.up[i].id,dnode = data[did];
					if(dnode && dnode._c){
						var arrow = me.paper.arrow(me.paper.getById(dnode._c.r),me.paper.getById(node._c.r));
						if(!dnode._c.down) dnode._c.down=[];
						dnode._c.down.push(arrow);
						if(!node._c.up) node._c.up =[];
						node._c.up.push(arrow);
					}
				}
			}
		}
		while(currentIndex < arr.length){
			var nodeid = arr[currentIndex],node= data[nodeid];
			if(!node._c && node.down.length>0){
				for (var i=0,l=node.down.length;i<l ;i++ ){
					var cNodeId = node.down[i],cNode = data2append[cNodeId],p = me.getFreePos(node._c);
					cNode._c=me.drawnode(p,cNode);
					data[cNodeId]=(cNode);
					arr.push(cNodeId);
				}
			}
			currentIndex ++;
		}
		//����ͷ
		for (var nodeid in data2append){
			var node = data[nodeid],arrd=node.down||[],c=node._c;
			if(!c.down) c.down=[];
			for (var i=0,l=arrd.length; i<l; i++){
				var cNodeId = arrd[i],cNode = data[cNodeId],cc= cNode._c;
				var arrow = me.paper.arrow(me.paper.getById(c.r),me.paper.getById(cc.r));
				c.down.push(arrow);
				if(!cc.up) cc.up =[];
				cc.up.push(arrow);
			}
		}

	},
	//���������ϵ������0:�ɹ�,1:fromNodeId,toNodeId������,2:fromNodeId->toNodeId���ܽ���������ϵ,3:������ϵ�Ѿ�����
	addDepency:function(fromNodeId,toNodeId){
		var me=this,data=me.data,fromNode = data[fromNodeId],toNode= data[toNodeId];
		if(!fromNode || !toNode ){
			return 1;
		}
		//��fromNodeId��ʼ����ͼ�������������toNodeId�����ܽ���������ϵ
		var arr=[fromNodeId],currentIndex = 0,pushedNodes={};
		pushedNodes[fromNodeId]=true;
		while(currentIndex<arr.length){
			var nodeid = arr[currentIndex],node=data[nodeid],up =node.up||[];
			for (var i=0,l=up.length;i<l ;i++ ){
				var did = up[i].id;
				if(did==toNodeId){return 2;}
				if(!pushedNodes[did]){
					arr.push(did);
					pushedNodes[did]=true;
				}
			}
			currentIndex ++;
		}
		//���������ϵ�Ƿ��Ѿ�����
		if(!fromNode.down) fromNode.down=[];
		for (var i=0,l=fromNode.down.length;i<l ;i++ ){
			if(fromNode.down[i]==toNodeId){return 3;}
		}
		//���ˡ������ϣ���ʼ����ͷ
		var arrow= me.paper.arrow(me.paper.getById(fromNode._c.r),me.paper.getById(toNode._c.r));
		fromNode.down.push(toNodeId);
		if(!toNode.up) toNode.up=[];
		toNode.up.push(fromNodeId);
		if(!fromNode._c.down)fromNode._c.down=[];
		fromNode._c.down.push(arrow);
		if(!toNode._c.up) toNode._c.up=[];
		toNode._c.up.push(arrow);
		return 0;
	}
};
