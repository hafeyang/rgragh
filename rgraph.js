/*
 *  rgraph.js
 *  graph implementation by Raphael
 *  @usage: 
 *      <pre> var graph =new RGraph("elementId",{node:"node Raphael plugin name",onnodeclick:fn_node_click})</pre>
 *  @author :yanghengfeng
 */
(function(){

    //Raphael的arrow扩展
    (!Raphael.fn.arrow ) && (Raphael.fn.arrow=function(from,to){
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

    RGraph = function(element,opt){
        this.c= typeof(element)=="string"?document.getElementById(element):element;
        var me=this,c=me.c;
        opt=opt||{};
        opt.onnodeclick = opt.onnodeclick||(me.onnodeclick||(function(){}));
        me.opt=opt;
        me.width= c.clientWidth;
        me.height = c.clientHeight;
        me.paper= Raphael(me.c,me.width,this.height) ;
        me.gridsize={w:180,h:100};//每个节点的宽高
        me.reset();
        me._bindCanvas();
    }

    RGraph.prototype= {
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
        _bindCanvas:function(){
            var me=this,c=this.c;
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
            me.canvasdragging= false;
            me.nodedragging=false;
            addEventListener(c,"mousedown",function(e){
                var evt = getEvent(e),drag = false,viewbox= me.getViewBox();
                if(e.which!=1) return ;//非右键无效
                if(evt.target.parentNode.id==me.c.id){//拖动canvas
                    me.canvasdragging={x:evt.clientX,y:evt.clientY};
                    me.c.style.cursor="move";
                }else{
                    var node = me.paper.getElementByPoint(evt.clientX,evt.clientY);
                    if(null!= node && node.data("id")){//拖动节点
                        var nodeid = node.data("id"),nodedata = me.data[nodeid],c=nodedata._c;
                        me.nodedragging={x:evt.clientX,y:evt.clientY,nodeid:nodeid,_x:evt.clientX,_y:evt.clientY};
                        me.paper.getById(c.r).attr({"cursor":"move"}).toFront();
                        me.paper.getById(c.t).attr({"cursor":"move"}).toFront();
                    }
                }
            });
            addEventListener(c,"mousemove",function(e){
                var evt = getEvent(e),viewbox=me.getViewBox();
                me.clearSelection();
                if(me.canvasdragging){
                    var x = parseInt((me.canvasdragging.x-evt.clientX)/me.zoom),
                        y = parseInt((me.canvasdragging.y-evt.clientY)/me.zoom),
                        viewbox = me.getViewBox();
                    me.canvasdragging={x:evt.clientX,y:evt.clientY};
                    me.setViewBox(viewbox.x+x,viewbox.y+y,viewbox.w,viewbox.h);
                }
                if(me.nodedragging){
                    var nodedragging=me.nodedragging,
                        x = (nodedragging.x-evt.clientX),
                        y = (nodedragging.y-evt.clientY),
                        node = me.data[nodedragging.nodeid],
                        c=node._c;
                    delete me.pos[c.x+"|"+c.y];
                    c.x-=(x/me.zoom);
                    c.y-=(y/me.zoom);
                    nodedragging.x= evt.clientX;
                    nodedragging.y= evt.clientY;
                    node._c= me.paper[me.opt.node](node._c);
                    me.pos[c.x+"|"+c.y]= nodedragging.nodeid;
                    for (var i=0,l=(c.down||[]).length;i<l ;i++ ){
                        me.paper.arrow(c.down[i]);
                    }
                    for (var i=0,l=(c.up||[]).length;i<l ;i++ ){
                        me.paper.arrow(c.up[i]);
                    }
                }
                //鼠标放在节点上，高亮节点和相关的箭头
                //排除现有行为
                if(me.canvasdragging || me.nodedragging) {return  ;}
                me.hovernode = me.paper.getElementByPoint(evt.clientX,evt.clientY);
                if(me.hovernode && me.hovernode.data("id")){
                    var hovernode=me.hovernode,nodeid= hovernode.data("id"),hovernode =me.data[nodeid];
                    (!hovernode._c.up) && (hovernode._c.up=[]);
                    if(me._lastHoverNode!=nodeid){//进入node
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
                        var node = me.data[nodeid],arr=[];
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
                    me._lastHoverNode = nodeid;
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
            addEventListener(c,"mouseup",function(e){
                var evt = getEvent(e);
                me.clearSelection();
                if(me.canvasdragging){
                    me.canvasdragging=false;
                    me.c.style.cursor="auto";
                }

                if(me.nodedragging){
                    var nodedragging=me.nodedragging,
                        node = me.data[nodedragging.nodeid],c=node._c,r = me.paper.getById(c.r);
                    me.paper.getById(c.r).attr({"cursor":"pointer"});
                    me.paper.getById(c.t).attr({"cursor":"pointer"});
                    if(nodedragging.x==nodedragging._x && nodedragging.y==nodedragging._y){//如果没有拖动位置，说明是点击
                        if(typeof(me.onnodeclick)=="function") me.onnodeclick.call(me,node);
                    }
                    me.nodedragging = false;
                }
                
            });
        },
        setViewBox:function(x,y,w,h,fit){
            var me =this;
            me.x=x;
            me.y=y;
            me.w=w;
            me.h=h;
            return me.paper.setViewBox(x,y,w,h,fit);
        },
        getViewBox:function(){
            return {x:this.x,y:this.y,w:this.w,h:this.h};
        },
        getZoom:function(){return this.zoom;},
        reset:function(){
            this.zoom=1;
            this.setViewBox(0,0,this.c.clientWidth,this.c.clientHeight);
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
        //检测该坐标是否可用
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
        //获取可用的位置
        getFreePos:function (p){
            var me = this,w=me.gridsize.w,h=me.gridsize.h, arr=[[p.x,p.y+h],[p.x+w,p.y+h],[p.x-w,p.y+h],[p.x,p.y+2*h],[p.x+w,p.y+2*h],[p.x-w,p.y+2*h],[p.x+2*w,p.y+2*h],[p.x-2*w,p.y+2*h],[p.x,p.y+3*h],[p.x+w,p.y+3*h],[p.x-w,p.y+3*h],[p.x+2*w,p.y+3*h],[p.x-2*w,p.y+3*h],[p.x+3*w,p.y+3*h],[p.x-3*w,p.y+3*h],[p.x,p.y+4*h],[p.x+w,p.y+4*h],[p.x-w,p.y+4*h],[p.x+2*w,p.y+4*h],[p.x-2*w,p.y+4*h],[p.x+3*w,p.y+4*h],[p.x-3*w,p.y+4*h],[p.x+4*w,p.y+4*h],[p.x-4*w,p.y+4*h]];
            if(me.isFree(p)){return p;}
            for (var i=0,l=arr.length; i<l; i++){
                var p2try ={x:arr[i][0],y:arr[i][1]};
                if(me.isFree(p2try)){
                    return {x:p2try.x+parseInt(Math.random()*20-10),y:p2try.y};
                }
            }
            //没找到随机值
            return {x:p.x+Math.random()*1000-500,y:p.y+Math.random()*1000-500};
        },
        //获取水平方向上的空地
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
            //没找到随机值
            return {x:p.x+Math.random()*1000-500,y:p.y+Math.random()*1000-500};
        },
        //从上而下的遍历数据
        travelfromtop:function (data,fn){
            var me = this;
            //topnodes :没有上游的节点
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
        //绘制一个节点
        drawnode:function (p,node){
            var me= this,
                highlightNodeIds = me.highlightNodeIds||[];
            me.pos[p.x+"|"+p.y]=node.id;
            node.highlight= false;
            for(var i=0,l=me.highlightNodeIds.length;i<l;i++){
                if(me.highlightNodeIds[i]==node.id){
                    node.highlight=true;
                    break;
                }
            }
            p=me.paper[me.opt.node](p,node);
            return me.paper[me.opt.node](p,node);
        },
        //加载数据
        loadData:function(data){
            var me =this;
            me.paper.clear();
            delete me.pos;
            me.pos={};
            me.reset();
            me.data = data;
            me.travelfromtop(data,function(node){
                if(node.up.length==0){
                    var viewbox=me.getViewBox(),p =me.getHorizontalFreePos({x:viewbox.x+400,y:viewbox.y+me.gridsize.h});
                    node._c=me.drawnode(p,node);
                }else{
                    for (var i=0,l=node.up.length; i<l; i++){
                        var d = node.up[i].id,dnode =data[d];
                        if(dnode._c){
                            var p = me.getFreePos(dnode._c);
                            node._c=me.drawnode(p,node);
                            break;
                        }
                    }
                }
            });
            //连箭头
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
        }
    };

})();
