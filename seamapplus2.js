/*
VORWORT
Bitte lesen!


Alle Funktionen und Klassen in diesem Script sind von mir selbst
geschrieben und entstammen aus meinen eigenen (verwobenen)
Gehirnwindungen.
Ich hab das Script bewusst nicht durch einen Kodierer gejagt, da ich der
Meinung bin, dass jeder von meiner (hoffentlich brauchbaren) Arbeit
profitieren können sollte.

ABER (ich erwähne das, da mir es leider schon ein paar Mal aufgefallen ist):
Ich bitte darum, dass - wenn Codestellen von mir
übernommen werden - mein Name im entsprechenden Script auch erwähnt
wird :)
Auch würde es mich natürlich freuen, wenn man mir per Nachricht
Bescheid gibt, dass Codestellen anderweitig Verwendung finden
konnten.

Bitte berücksichtigt mir diesen Wunsch.
Ich hab hier wirklich viel Arbeit, Herzblut und Gehirnschmalz reingesteckt.
Da ärgert es mich natürlich wenn andere meine Arbeit als Eigene
ausgeben :)

Jodli
jodlidev@gmail.com
*/

const __server = getServer(),
	SVGNS_XLINK = "http://www.w3.org/1999/xlink",
	NEUTRAL = 0,
	FRIEND = 1,
	ALLY = 2,
	ENEMY = 3,
	
	UNKNOWN = 0,
	ROMANS = 1,
	VIKINGS = 2
	AZTECS = 3,
	MERCHANT = 1,
	KRAKEN = 2,
	
	FF = 0,
	CHROME = 1;

var __browser = navigator.userAgent.toLowerCase().indexOf("chrome")!=-1 ? CHROME : FF,
	__release, __bundles,
	__locale = {},
	__disabled = false;


function GM_getValue(key,def) {
	var out = localStorage[key] || def;
	
	if(out == "false")
		out = false;
	else if(out == "true")
		out = true;
	return out;
}
function GM_setValue(key,value) {
	return localStorage[key] = value;
}
function GM_deleteValue(key) {
	delete localStorage[key];
}
function getServer() {
	var m = window.location.href.match(/http:\/\/(.+).escaria.com\/world\/.+/);
	return m ? m[1] : false;
}


//**********
//classics
//**********

function getEl(value, parent) {
	return document.evaluate(
		value,
		parent || document,
		null,
		XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
		null);
}
function gid(Wert) {
	return document.getElementById(Wert);
}
function appendElement(eT, eP, attr, css) {
	var e=document.createElement(eT), i;
	if(css)
		e.style.cssText=css;
	if(attr)
		for(i in attr)
			e[i] = attr[i];
	if(eP)
		eP.appendChild(e);
	return e;
}
function add_class(el, c) {
	el.className += " "+c;
}
function remove_class(el, c) {
	el.className = el.className.replace(" "+c, "");
}


function checkBoundaries(v, min, max) {
	return Math.max(min, Math.min(max, v))
}

function toChild(el, i) {//kein Node.prototype in Greasemonkey...
	while(i--)
		el=el.firstChild;
	return el;
}

EventBox = {
	_index: 1,
	_container: {},
	_index_global: 1,
	_globals: {},
	_packages: {},
	
	event: function(el, e) {
		var c = EventBox._container[el.getAttribute("GM_event_"+e)];
		c[0].apply(c[1] || el, c[2]);
	},
	addListener: function(el, e, fu, arguments, _this) {
		el.addEventListener(e, this._action);
		if(fu) {
			arguments = arguments || [];
			arguments.push(e);
			el.setAttribute("GM_global_"+e, this._index_global);
			this._globals[this._index_global] = [fu, _this || el, arguments];
			
			while(this._globals.hasOwnProperty(this._index_global++));
			return this._index_global;
		}
		return 0;
	},
	removeListener: function(el, e) {
		el.removeEventListener(e, this._action);
		
		if(el.hasAttribute("GM_global_"+e)) {
			var id = el.getAttribute("GM_global_"+e);
			el.removeAttribute("GM_global_"+e);
			
			delete this._globals[id];
		}
	},
	bind: function(el, e, fu, arguments, _this) {
		arguments = arguments || [];
		arguments.push(e);
		if(el)
			el.setAttribute("GM_event_"+e, this._index);
		this._container[this._index] = [fu, _this, arguments, 1];
		
		var index = this._index;
		while(this._container.hasOwnProperty(++this._index));
		return index;
	},
	bind_fu: function(el, e, index) {
		el.setAttribute("GM_event_"+e, index);
	},
	bind_p: function(id, el, e, fu, arguments, _this) {
		this._packages[id].push([el, e]);
		this.bind(el, e, fu, arguments, _this);
	},
	unbind: function(el, e) {
		var id = el.getAttribute("GM_event_"+e);
		el.removeAttribute("GM_event_"+e);
		
		if(!(--this._container[id][3])) // because of cloning
			delete this._container[id];
	},
	cloneEvents: function(el, e, source_el) {
		var i= e.length, el_length = el.length, il,
			e_type, id;
		
		while(i--) {
			il = el_length;
			e_type = e[i];
			id = source_el.getAttribute("GM_event_"+e_type);
			
			this._container[id][3] += il;
			
			while(il--) {
				el[il].setAttribute("GM_event_"+e_type, id);
			}
		}
	},
	cloneEvents_p: function(p_id, el, e, source_el) {
		var i= e.length, el_length = el.length, il,
			e_type, id;
		
		while(i--) {
			il = el_length;
			e_type = e[i];
			id = source_el.getAttribute("GM_event_"+e_type);
			
			this._container[id][3] += il;
			
			while(il--) {
				el[il].setAttribute("GM_event_"+e_type, id);
				this._packages[p_id].push([el[il], e_type]);
			}
		}
	},
	createPackage: function(id) {
		this._packages[id] = [];
	},
	emptyPackage: function(id) {
		var p = this._packages[id],
			i = p.length;
			
		while(i--) {
			this.unbind.apply(this, p[i]);
		}
		this._packages[id] = [];
	},
	removePackage: function(id) {
		this.emptyPackage(id);
		delete this._packages[id];
	},
	_action: function(e) {
		var el = (__browser==FF) ? e.target : e.srcElement;
		if(el.hasAttribute("GM_event_"+e.type)) {
			var c = EventBox._container[el.getAttribute("GM_event_"+e.type)];
			e["GM_target"] = el;
			c[2].splice(-1,1,e);
			if(c[0].apply(c[1] || el, c[2]))
				return;
		}
		if(e.currentTarget.hasAttribute("GM_global_"+e.type)) {
			var g = EventBox._globals[e.currentTarget.getAttribute("GM_global_"+e.type)];
			e["GM_target"] = el;
			g[2].splice(-1,1,e);
			g[0].apply(g[1], g[2]);
		}
		
	}
}

Pref = {
	_bool_keys: {},
	_bool: GM_getValue(__server+"bool_options", 33552635),
	
	load: function(k, s, isFloat) {
		var v = GM_getValue(__server+k, s);
		
		if(typeof s == "number")
			this[k] = (isFloat && v != s) ? v/100 : Number(v);
		else
			this[k] = v;
		
	},
	load_array: function (k) {
		var t = GM_getValue(__server+k, false);
		
		this[k] = t ? t.split("\n") : [];
	},
	load_object: function(k) {
		var kv = GM_getValue(__server+k+"_keys", false),
			v = GM_getValue(__server+k, "").split("\n"),
			i = 0,
			max = v.length,
			o = this[k] = {};
		
		if(kv)
			kv = kv.split("\n");
		else
			return;
		
		for(; i<max; i++) {
			o[kv[i]] = v[i];
		}
	},
	load_bool: function(k) {
		var bin_k = Math.pow(2,k);

		return ((this._bool & bin_k) == bin_k);
	},
	load_bool_package: function(keys) {
		var i = keys.length,
			k;
		
		while(i--) {
			k = keys[i];
			this[k] = this.load_bool(i);
			this._bool_keys[k] = i;
		}
	},
	save: function(k, v, isFloat) {
		if(isFloat)
			v = Math.round(v*100);
		else if(typeof this[k] == "number")
			v = Number(v);
		
		GM_setValue(__server+k, this[k] = v);
	},
	save_array: function(k, v) {
		this[k].push(v);
		GM_setValue(__server+k, this[k].join("\n"));
	},
	save_object: function(k, kv, v) {
		var o = this[k],
			k_string = "",
			v_string = "";
		
		if(kv)
			o[kv] = v;
		
		for(var i in o) {
			k_string += i+"\n";
			v_string += o[i]+"\n";
		}
		GM_setValue(__server+k+"_keys", k_string.slice(0,-1));
		GM_setValue(__server+k, v_string.slice(0,-1));
	},
	save_bool: function(k, v) {
		var k_num = this._bool_keys[k];
			bin_k = Math.pow(2,k_num),		
			current = this.load_bool(k_num, false);
		
		this._bool = this._bool - (current ? bin_k : 0) + (v ? bin_k : 0);
		this[k] = v;
		GM_setValue(__server+"bool_options", this._bool);
	},
	delete_inArray: function(k, i) {
		this[k].splice(i,1);
		GM_setValue(__server+k, this[k].join("\n"));
	},
	delete_inObject: function(k, i) {
		delete this[k][i];
		this.save_object(k);
	}
};

Dnd = {
	_current_boundaries:null,
	_current_positioner: null,
	_current_positioner_this: null,
	_current_correctX: 0,
	_current_correctY: 0,
	_pos_container: [],
	_index:0,
	_last_use:0,
	_click_timeout_id:null,
	
	init: function() {
		this._dragger = appendElement("div", false, false, "position:absolute; left:0; right:0; top:0; bottom:0; z-index:999999;");
		
		EventBox.bind(this._dragger, "mouseup", this.stop_drag, false, this);
		EventBox.addListener(this._dragger, "mousemove");
		EventBox.bind(this._dragger, "mousemove", this._drag, false, this);
	},
	_get_pos: function(e) {
		return [
			checkBoundaries(this._startObjX + e.pageX - this._startX, this._current_boundaries[0], this._current_boundaries[1]),
			checkBoundaries(this._startObjY + e.pageY - this._startY, this._current_boundaries[2], this._current_boundaries[3])
			];
		
	},
	make_dragable: function(el, boundaries, positioner, _this, start, endFu, clickFu, dblclickFu) {
		this._pos_container[this._index] = start || [0,0];
		EventBox.bind(el, "mousedown", this.start_drag, [el, boundaries, positioner, _this, endFu, clickFu, dblclickFu, this._index], this);
		
		el.setAttribute("GM_DnD", this._index++);
	},
	start_drag: function(el, boundaries, positioner, _this, endFu, clickFu, dblclickFu, index, e) {
		this._current_index = index;
		this._current_positioner = positioner;
		this._current_boundaries = boundaries.apply(_this);
		this._startX = e.pageX;
		this._startY = e.pageY;
		this._startObjX = this._current_boundaries[4] || this._pos_container[index][0];
		this._startObjY = this._current_boundaries[5] || this._pos_container[index][1];
		this._current_this = _this;
		this._current_endFu = endFu;
		this._current_clickFu = clickFu;
		this._current_dblclickFu = dblclickFu;
		
		document.body.appendChild(this._dragger);
		
		
		if(e.GM_target == el)
			this._drag(e);
		else {
			var props = el.getBoundingClientRect();
			positioner.apply(_this, [this._startObjX = checkBoundaries(this._startObjX + e.pageX-props.left - props.width/2, this._current_boundaries[0], this._current_boundaries[1]),
					this._startObjY = checkBoundaries(this._startObjY + e.pageY-props.top - props.height/2, this._current_boundaries[2], this._current_boundaries[3])]);
		}
		e.preventDefault();
		e.stopPropagation();
	},
	stop_drag:function(e) {
		this._pos_container[this._current_index] = this._get_pos(e);
		
		document.body.removeChild(this._dragger);
		
		//if(this._current_clickFu && Math.abs(this._startX - e.pageX) + Math.abs(this._startY - e.pageY) < 2) {
			//if(this._current_dblclickFu && (new Date()).getTime() - this._last_use < 200) {
				//window.clearTimeout(this._click_timeout_id);
				//this._current_dblclickFu.apply(this._current_this, [e]);
			//}
			//else
				//this._click_timeout_id = window.setTimeout(function() {Dnd._current_clickFu.apply(Dnd._current_this, [e])}, 200);
		//}
		//else if(this._current_endFu)
			//this._current_endFu.apply(this._current_this, [e]);
		if(Math.abs(this._startX - e.pageX) + Math.abs(this._startY - e.pageY) < 2) {
			if(this._current_dblclickFu && (new Date()).getTime() - this._last_use < 200) {
				if(this._current_clickFu)
					window.clearTimeout(this._click_timeout_id);
				this._current_dblclickFu.apply(this._current_this, [e]);
			}
			else if(this._current_clickFu) {
				if(this._current_dblclickFu)
					this._click_timeout_id = window.setTimeout(function() {Dnd._current_clickFu.apply(Dnd._current_this, [e])}, 200);
				else
					this._current_clickFu.apply(Dnd._current_this, [e]);
			}
		}
		else if(this._current_endFu)
			this._current_endFu.apply(this._current_this, [e]);
			
		
		this._last_use = (new Date()).getTime();
		
		return true;
	},
	_drag:function(e) {
		var x = e.pageX,
			y = e.pageY;
		
		this._current_positioner.apply(this._current_this, this._get_pos(e));
	},
	move_el(el, x, y) {
		var index = el.getAttribute("GM_DnD");
		this._pos_container[index] = [x, y];
		el.style.top = y + "px";
	}
	
}


//**********
//spezifics
//**********

function createBundle(b, eP, attr, css) {
	var e=document.createElement("div");
	e.style.cssText="background-image:"+__bundles[b][0]+"; background-position:"+__bundles[b][3]+"; width:"+__bundles[b][1]+"; height:"+__bundles[b][2]+";"+(css || "");
	if(attr)
		for(i in attr)
			e[i] = attr[i];
	if(eP)
		eP.appendChild(e);
	return e;
}

function get_localVar(k) {
	move=appendElement("div", document.body, {id:"GM_seamap_moveVars"}, "display:none"),
		script=appendElement("script", document.body, {type:"application/javascript", textContent:"document.getElementById('GM_seamap_moveVars').textContent=___stdlib_fastcall____startupConfiguration___['"+k+"'];"});
	var r = gid('GM_seamap_moveVars').textContent;
	
	document.body.removeChild(script);
	document.body.removeChild(move);
	
	return r;
}

function do_action(el, e_type, bubble, x, y) {
	var e = document.createEvent("MouseEvents");
		e.initMouseEvent(e_type, bubble || false, true, window, 0, 0, 0,
		x || 0,
		y || 0,
		false, false, false, false, 0, null);
	el.dispatchEvent(e);
}

function Window(title, width, height) {
	this._bind_id = Math.round(Math.random()*1000);
	EventBox.createPackage(this._bind_id);
	this.group = appendElement("div", false, false, "z-index:9999; position: absolute; left: 50%; right: 150px; top: 50px; width:"+width+"px; height:"+height+"px; margin-left:-"+(width/2)+"px;");
	
	var wrapper = appendElement("div", this.group, {className:"PopupWrapper"}, "width:100%; height:100%;");
	appendElement("div", wrapper, {className:"PopupMiddleLeft"});
	appendElement("div", wrapper, {className:"PopupMiddleRight"});
	appendElement("div", wrapper, {className:"PopupTopCenter"});
	appendElement("div", wrapper, {className:"PopupBottomCenter"});
	appendElement("div", wrapper, {className:"PopupTopLeft"});
	appendElement("div", wrapper, {className:"PopupTopRight"});
	appendElement("div", wrapper, {className:"PopupBottomLeft"});
	appendElement("div", wrapper, {className:"PopupBottomRight"});
	var contentWrapper = appendElement("div", wrapper, {className:"PopupLightContentWrapper"}, "width:100%; height:100%;");
	
	var header_wrapper = appendElement("div", contentWrapper, {className:"PopupHeaderWrapper"});
	var header = appendElement("div", header_wrapper, {className:"PopupHeader"});
	appendElement("div", header, {className:"PopupHeaderLeft"});
	appendElement("div", header, {className:"PopupHeaderRight"});
	appendElement("div", header, {className:"PopupHeaderContent", textContent:title});
	
	this.bind(createBundle("close", contentWrapper, {className:"PopupCloseButton"}), "mouseup", this.close, false, this);
	
	
	this.content = appendElement("div", contentWrapper, false, "position:absolute; left:20px; right:20px; top: 20px; bottom: 20px; overflow:auto;");
	EventBox.addListener(this.content, "change");
	
	gid("popupBackground").style.display = "block";
	
	return this;
}
Window.prototype = {
	_bind_id: 0,
	_createdColorTable: false,
	_start_r: 255,
	_start_g: 0,
	_start_b: 0,
	current_color: "#ff0000",
	_mousedown_verticalColor: false,
	_mousedown_boxColor: false,
	_box_pointer_x: 200,
	_box_pointer_y: 0,
	
	insert: function() {
		document.body.appendChild(this.group);
	},
	close: function() {
		EventBox.removeListener(this.content, "change");
		if(this._createdColorTable)
			EventBox.removeListener(this.content, "mousedown");
		
		EventBox.removePackage(this._bind_id);
		document.body.removeChild(this.group);
		
		gid("popupBackground").style.display = "none";
	},

	bind: function(el, e, fu, arguments, _this) {
		EventBox.bind_p(this._bind_id, el, e, fu, arguments, _this);
	},
	cloneEvents: function(el, e, source_el) {
		EventBox.cloneEvents_p(this._bind_id, el, e, source_el);
	},
	_rgb_toString: function(r, g, b) {
		
		r = Math.round(r).toString(16);
		if(r.length < 2)
			r = "0"+r;
		g = Math.round(g).toString(16);
		if(g.length < 2)
			g = "0"+g;
		b = Math.round(b).toString(16);
		if(b.length < 2)
			b = "0"+b;
		
		return "#"+r+g+b;
	},
	
	
	_set_verticalColor: function(y) {
		var w = 200/6,
			r = (y/w-1.5)/3,
			g = (y/w-3.5)/3,
			b = (y/w-5.5)/3;
		
		//selfmade and ugly:
		r = Math.round(checkBoundaries(Math.pow(-1, Math.round(r))*(Math.round(r)-r)*765+127.5, 0, 255)); //765 = 255*3; 127.5 = 255*0.5
		g = Math.round(checkBoundaries(Math.pow(-1, Math.round(g))*(Math.round(g)-g)*765+127.5, 0, 255)); //765 = 255*3; 127.5 = 255*0.5
		b = Math.round(checkBoundaries(Math.pow(-1, Math.round(b))*(Math.round(b)-b)*765+127.5, 0, 255)); //765 = 255*3; 127.5 = 255*0.5
		
		this._start_r = r;
		this._start_g = g;
		this._start_b = b;
		
		this.verticalColor_pointer.style.top = y+"px";
		
		this._boxColor.style.backgroundColor = this._rgb_toString(r,g,b);
		this._set_boxColor(this._box_pointer_x, this._box_pointer_y);
	},
	_set_boxColor: function(x,y) {
		var percentX = 1/(200/x),
			percentY = 1/(200/y),
			rx = 255 - (255-this._start_r)*percentX,
			gx = 255 - (255-this._start_g)*percentX,
			bx = 255 - (255-this._start_b)*percentX,
			
			r = rx - (rx/200)*y,
			g = gx - (gx/200)*y,
			b = bx - (bx/200)*y;
		
		this._box_pointer_x = x;
		this._box_pointer_y = y;
		this.boxColor_pointer.style.left = x+"px";
		this.boxColor_pointer.style.top = y+"px";
		this.current_color = this._rgb_toString(r,g,b);
		
		this.colorStatus_temp.style.backgroundColor = this.current_color;
		this.colorStatusText.value = this.current_color;
	},
	
	
	_setTextColor: function() {
		var color = this.colorStatusText.value,
			r = parseInt(color.slice(1,3)),
			g = parseInt(color.slice(3,5)),
			b = parseInt(color.slice(3,5))
			max = Math.max(r, Math.max(g,b));
			
		this.colorStatus_temp.style.backgroundColor = this.colorStatus_final.style.backgroundColor = color;
		
		if(r == max) {
			
		}
		else if(g == max) {
			
		}
		else if(b == max) {
			
		}
	},
	create_colorTable: function() {
		this._createdColorTable = true;
		EventBox.addListener(this.content, "mousedown");
		
		
		this._boxColor = appendElement("div", this.content, false, "position:absolute; left:0; top:30px; width:200px; height:200px; border:1px solid black; background-color:red;");
		this.boxColor_pointer = appendElement("div", this._boxColor, false, "position:absolute; left:200px; top:0px; width:10px; height:10px; margin:-7px; border:1px inset #46300D; border-radius:10px; background-color:rgba(255,255,255,0.1)");
		var boxColor_middle = appendElement("div", this._boxColor, false, "width:100%; height:100%; background-image: linear-gradient(to right, rgb(255, 255, 255), rgba(255, 255, 255, 0))"),
			boxColor_front = appendElement("div", boxColor_middle, false, "width:100%; height:100%; background-image: linear-gradient(to bottom, transparent, rgb(0, 0, 0));");
		
		Dnd.make_dragable(this.boxColor_pointer, function() {
				return [0,200,0,200];
			}, 
			function(x,y) {
					this._set_boxColor(x, y);
				}, this, [200, 0],
			function(e) {//end
					this.colorStatus_final.style.backgroundColor = this.colorStatus_temp.style.backgroundColor;
				});
		this.cloneEvents([boxColor_front], ["mousedown"], this.boxColor_pointer);
		
		//###transparenz
		//var IMG_transparent ="url('data:image/jpeg;base64,R0lGODlhFAAUAJEAAAAAAP///3V1df///yH5BAEAAAMALAAAAAAUABQAAAI4lBWpdxrsEjMOxolWuzNqW21Sx1GfeIZgeppqNq4x+boPOtvyve7Y6/mxarASjlcUAlvFGTF4KAAAOw==')";
		//var transparent = appendElement("div", boxColor_front, false, "position:absolute; right:0; bottom:0; background-image:"+IMG_transparent);
		//var verticalColor_transparent = appendElement("div", verticalColor, false, "position:absolute; left:0; bottom:0; width:25px; height:2px; background-image:url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAADCAYAAABmpKSeAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QcLAQE1ST9hFQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAiSURBVBjTY2xvb//PAAUVFRUwJkNHRwcDtcSZGOgA6GIJAJsUDppWiDNnAAAAAElFTkSuQmCC')");

		
		
		var verticalColor = appendElement("div", this.content, false, "position:absolute; left:210px; top:30px; width:25px; height: 200px;  border:1px solid black; background-image:linear-gradient(to bottom, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);");
		this.verticalColor_pointer = appendElement("div", verticalColor, false, "position:absolute; left:-2px; top:0; width:27px; height:1px; margin-top:-1px; border:1px solid black;");
		
		Dnd.make_dragable(this.verticalColor_pointer, function() {
				return [0,0,0,200];
			}, 
			function(x,y) {
					this._set_verticalColor(y);
				}, this, false,
			function(e) {//end
					this.colorStatus_final.style.backgroundColor = this.colorStatus_temp.style.backgroundColor;
				});
		this.cloneEvents([verticalColor], ["mousedown"], this.verticalColor_pointer);
		
		
		
		this.colorStatus_temp = appendElement("div", this.content, false, "position:absolute; left: 192px; top:0; width:20px; height:20px; border: 1px solid black; background-color:red;");
		this.colorStatus_final = appendElement("div", this.content, false, "position:absolute; left: 215px; top:0; width:20px; height:20px; border: 1px solid black; background-color:red;");
		var label = appendElement("label", this.content, {textContent:__locale.color+": "}, "position:absolute; left: 0; top:0; width: 170px;");
		this.colorStatusText = appendElement("input", label, {type:"text", value:"#ff0000"}, "width: 80px; height: 17px; padding:0; text-align:center;");
		//###textfield-change
		//EventBox.addListener(this.colorStatusText, "change", this._setTextColor, false, this);
		
		this.content = appendElement("div", this.content, false, "position:absolute; left: 250px; top:0;");
	}
}

Options = {
	init: function() {
		var opt_button = createBundle("options", gid("seamap"), {className:"GM_clickable"}, "position:absolute; left:-2px; bottom:-5px; z-index:3001;");
		
		//this._opt_button = createBundle("world_button", gid("seaMapOptionMenu"), {className:"buttonMenuItem"}, "float:left; cursor:pointer;");
		//var opt_text = appendElement("div", opt_button, {textContent:"SP"}, "margin:10px 12px; opacity:0.7; font-size:12px");
		
		EventBox.bind(opt_button, "mouseup", this.open, false, this);
		//EventBox.cloneEvents([opt_text], ["mouseup"], opt_button);
	},
	open: function() {
		var win = new Window(__locale.options, 450, 400);
		
		
		this.add_textBox(win, "Im Cache behalten", "Inseln", "cacheMax", " 0=unendlich; Ist der Cache voll, werden zufällige Inseln aus dem Cache entfernt. Wobei NPCs immer zuerst entfernt werden. Momentan im Speicher: "+Data._cache_num, function() {--this._cache_num; this.check_cache();}, Data);
		this.add_textBox(win, "Seekarten-Verlauf", "Schritte", "history_max", "Wieviele Seekartenpositionen sich seamapPlus merken und im Verlauf abspeichern soll.");
		appendElement("div", win.content, {textContent: "Immer im Cache behalten:"});
		this.add_checkbox(win, __locale.friends, "cache_save_friends");
		this.add_checkbox(win, __locale.allys, "cache_save_ally");
		this.add_checkbox(win, __locale.enemys, "cache_save_enemys");
		this.add_checkbox(win, __locale.marked, "cache_save_marked");
		
		this.add_textBox(win, "Worldmap-Icon-Größe", "px", "icon_size", "Größe der Icons auf der Weltkarte", Minimap.refresh_islands, Minimap);
		this.add_textBox(win, "Minimap-Breite", "px", "minimap_width", "Breite der Minimap", function() {Pref.save_bool("minimap_expanded", true); Minimap.toggle_expand();}, Minimap);
		this.add_textBox(win, "Minimap-Höhe", "px", "minimap_height", "Höhe der Minimap", function() {Pref.save_bool("minimap_expanded", true); Minimap.toggle_expand();}, Minimap);
		this.add_textBox(win, "Verzögerung der Insel-Überprüfung", "ms", "delay_time", "Die Überprüfung des Sichtbereichs sollte erst erfolgen, wenn Escaria alle Inseln geladen hat, ansonsten ist es möglich, dass Inseln \"übersehen\" werden.");
		this.add_checkbox(win, "Zusatzradius einzeichnen", "radius", function() {Radius.calc_radius()});
		appendElement("div", win.content, {textContent: "(Option zeigt erst Effekt, wenn die eigene Insel auf Seekarte neugeladen wurde)"}, "font-size:x-small");
		this.add_textBox(win, "Highlevel", "Level", "highlevel", "Ab dem hier angegebenen Level werden Inseln immer (unabhängig von Handelsstationen) als Highlevel markiert.", function() {Data.reset_island_level(); Data.loop_islands(); Minimap.refresh_islands();}, Data);
		this.add_textBox(win, "Lowlevel", "Level", "lowlevel", "Ab dem hier angegebenen Level werden Inseln immer (unabhängig von Handelsstationen) als Lowlevel markiert.", function() {Data.reset_island_level(); Data.loop_islands(); Minimap.refresh_islands();}, Data);
		
		
		this.add_checkbox(win, "Überspringe das Tutorial beim Seitenstart", "tutorial_skip");
		
		appendElement("a", appendElement("div", win.content, false, "text-align:center; margin:center;"), {href: "http://forum.escaria.com/index.php?page=Thread&threadID=8557", target:"_blank", textContent: "Feedback", className:"GM_clickable"});
		
		win.insert();
		return true;
	},
	add_checkbox: function(win, title, key, fu, _this) {
		var label = appendElement("label", win.content, {className:"GM_clickable"}, "display:block"),
			checkbox = appendElement("input", label, {type: "checkbox", checked:Pref[key]});
		win.bind(label, "mouseup", function(key, checkbox, fu, _this) {
				Pref.save_bool(key, !checkbox.checked);
				
				if(fu)
					fu.apply(_this);
			}, [key, checkbox, fu, _this], this);
		
		win.cloneEvents([checkbox, appendElement("span", label, {textContent: title})], ["mouseup"], label);
	},
	add_textBox: function(win, title, unit, key, desc, fu, _this) {
		var label = appendElement("div", win.content, {innerHTML:title+":&nbsp;"}, "margin:15px 5px;"),
			text = appendElement("input", label, {type: "text", value: Pref[key]}, "width:50px; text-align:center;");
		appendElement("span", label, {textContent:unit}, "font-size:x-small;");
		var img = appendElement("img", label, {src:__release+"gfx/icons/ok_icon_small.png", className:"GM_clickable"}, "vertical-align:middle; height:20px; margin-left:5px;");
		appendElement("div", label, {textContent:desc}, "font-size:x-small;");
	
		win.bind(text, "change", function(text) {
				text.style.backgroundColor = "#FFAFAF";
			}, [text]);
		win.bind(img, "mouseup", function(key, text, fu, _this) {
				Pref.save(key, text.value);
				text.style.backgroundColor = "white";
				if(fu)
					fu.apply(_this);
			}, [key, text, fu, _this], this);
	}
}
Tutorial = {
	max:23,
	index: 0,
	started:false,
	_handY:0,
	_marker_container:null,
	_tutorial_box:null,
	_hand_intervall_ID: null,
	_overrides: [],
	_clicks: [],
	
	
	init: function() {
		if(Pref.tutorial_skip)
			return;
		window.setTimeout(function() {
			var win = new Window("Tutorial", 450, 180);
			
			win.content.style.textAlign = "center";
			
			appendElement("div", win.content, {innerText: "SeamapPlus erweitert Escaria um viele neue Funktionen!\r\nMöchtest Du das Tutorial starten?"}, "margin-top:10px");
			var later = appendElement("button", win.content, {textContent: "Nächstes Mal", className: "GM_clickable"}, "margin:10px; width:150px"),
				start = appendElement("button", win.content, {textContent: "Los geht's!", className: "GM_clickable"}, "margin:10px; width:150px; font-weight:bold"),
				never = appendElement("a", win.content, {textContent: "[Nicht mehr fragen]", className: "GM_clickable"}, "display:block; font-size:small;");
			
			EventBox.bind(start, "mouseup", function() {
					win.close();
					Tutorial.start();
				}, false, Tutorial);
			EventBox.bind(never, "mouseup", function() {
					win.close();
					Tutorial.stop(true);
				}, false, Tutorial);
			EventBox.bind(later, "mouseup", win.close, false, win);
			
			win.insert();
		}, 1000);
	},
	start: function() {
		gid("game_widget").style.height = (window.innerHeight - 30)+"px";
		//gid("game_widget").style.marginTop = "30px";
		
		var box = this._tutorial_box = appendElement("div", false, false, "position:absolute; left:0; right:0; bottom:0; height:25px; padding:5px 20px 0 40%; z-index:101; background: url('http://themes.static.escaria.com/default/bkg_header.png'); box-shadow:0 0 30px 5px black;");
		
		
		
		var question_on = createBundle("question_mark2", box, {title:"Tipps verstecken", className:"GM_clickable"}, "display:inline-block; float:left"),
			question_off = createBundle("question_mark1", box, {title:"Tipps einblenden", className:"GM_clickable"}, "display:none; float:left; opacity:0.5");
		EventBox.bind(question_on, "mouseup", 
				function() {this._marker_container.style.display = question_on.style.display = "none"; question_off.style.display = "inline-block";}, false, this);
		EventBox.bind(question_off, "mouseup", 
				function() {question_off.style.display = "none"; question_on.style.display = "inline-block"; this._marker_container.style.display = "block"}, false, this);
		
		
		appendElement("span", box, {textContent:"Tutorial-Fortschritt:"}, "font-size:large; font-weight:bold; float:left; margin-left:10px; margin-right:5px");
		
		var bar_box = appendElement("div", box, {className:"premiumPanel"}, "display:inline-block; width:100px; height:20px; text-align:left; float:left;");
		
		this._bar_progress = appendElement("div", 
				appendElement("div", bar_box, {className:"durationBarRed"}, "position:absolute; margin-left:1px; background: linear-gradient(to bottom, #989382, #756E57); border-radius:5px;"),
				{className:"durationBarGreen"}, "position:absolute;");
		createBundle("bar_back", bar_box, false, "position:absolute;");
		this._status_box = appendElement("span", bar_box, false, "position:absolute; text-align:center; width:100px; font-weight:bold; color:white; margin-top:1px;");
		
		
		//EventBox.bind(createBundle("close", box, {title:"Tutorial abbrechen", className:"GM_clickable"}, "display:inline-block; float:right; margin-top:5px"), "mouseup", this.stop, false, this);
		EventBox.bind(appendElement("div", box, {title:"Tutorial abbrechen", className:"GM_clickable", textContent:"[abbrechen]"}, "display:inline-block; float:right; margin-top:10px; font-size: x-small"), "mouseup", function() {this.stop();}, false, this);
		
		
		gid("game_widget").appendChild(box);
		
		
		this._marker_container = appendElement("div", gid("seamap"), false, "pointer-events:none; position:absolute; left:0; top:0;");
		this._hand_intervall_ID = window.setInterval(Tutorial._move_hand, 100);
		window.addEventListener("resize", this._win_resize);
		this.step();
		this.started = true;
	},
	stop: function(neveragain) {
		if(this.started) {
			this.reset();
			window.clearInterval(this._hand_intervall_ID);
			window.removeEventListener("resize", this._win_resize);
			
			gid("game_widget").style.height = "100%";
			gid("game_widget").style.marginTop = "0";
			
			this._tutorial_box.parentNode.removeChild(this._tutorial_box);
			this._marker_container.parentNode.removeChild(this._marker_container);
			
			
		}
		if(neveragain)
			Pref.save_bool("tutorial_skip", true);
		delete Tutorial;
	},
	
	_win_resize: function() {
		Tutorial.step();
		gid("game_widget").style.height = (window.innerHeight - 25)+"px";
	},
	
	_move_hand: function(el) {
		var els = Tutorial._marker_container.childNodes,
			i = els.length,
			y = Math.abs(Tutorial._handY%10-2*(Tutorial._handY%5));
			
		while(i--) {
			els[i].firstChild.style.top = y+"px";
		}
		++Tutorial._handY;
	},
	
	_override: function(p, key, index) {
		var fu = p[key];
		this._overrides.push([p, key, fu]);
		p[key] = this._run_override;
		
		
		
		p[key] = function() {
				p[key] = fu;
				Tutorial.reset();
				
				fu.apply(p, arguments);
				
				window.setTimeout(function() {
						Tutorial.index = index;
						Tutorial.step.apply(Tutorial);
					}, 50);
			};
	},
	
	_set_click: function(el, index) {
		el.setAttribute("GM_tutorial_index", index);
		el.addEventListener("mouseup", this._run_click);
		this._clicks.push(el);
	},
	_remove_click: function(el) {
		el.removeEventListener("mouseup", this._run_click);
	},
	_run_click: function() {
		this.removeEventListener("mouseup", Tutorial._run_click);
		var index = this.getAttribute("GM_tutorial_index");
		Tutorial.index = Number(index) || index; //if there actually is a string, its there on purpose and will be changed in step()
		Tutorial.reset();
		window.setTimeout(function() {Tutorial.step.apply(Tutorial);}, 50);
	},
	
	reset: function() {
		var a = this._overrides,
			i = a.length,
			v;
		while(i--) {
			v = a[i];
			(v[0])[v[1]] = v[2];
		}
		this._overrides = [];
		
		
		a = this._clicks;
		i = a.length;
		while(i--) {
			a[i].removeEventListener("mouseup", this._run_click);
		}
		this._clicks = [];
	},
	
	mark_position: function(description, posX, posY, reverseX, reverseY, action) {
		var win_width = window.innerWidth,
			win_height = window.innerHeight,
			container = appendElement("div", false, false, "position:absolute; z-index:99999; opacity:0.9; width:"+__bundles["hand_ne"][1]+"; height:"+__bundles["hand_ne"][2]), //hand_ne: assumning that all hands have the same size
			hand, desc_style, pointer_style;
		
		if(reverseX)
			posX = win_width - posX;
		if(reverseY)
			posY = win_height - posY;
		
		if(posX < win_width/2) {
			if(posY < win_height/2) {
				hand = "hand_sw";
				container.style.top = (posY + 5 - parseInt(__bundles[hand][2])) + "px"; //5: position fingertip
				desc_style = "left:-10px; top:"+__bundles[hand][2];
				pointer_style = "position:absolute; top:-14px; left:5px; transform:rotate(180deg);";
			}
			else {
				hand = "hand_nw";
				container.style.top = (posY - 10) + "px"; //10: position finger
				desc_style = "left:-10px; bottom:"+__bundles[hand][2];
				pointer_style = "position:absolute; bottom:-14px; left:5px;";
			}
			
			container.style.left = (posX - 15) + "px";//15: position fingertip
		}
		else {
			if(posY < win_height/2) {
				hand = "hand_se";
				container.style.top = (posY+5 - parseInt(__bundles[hand][2])) + "px";
				desc_style = "right:-10px; top:"+__bundles[hand][2];
				pointer_style = "position:absolute; top:-14px; right:5px; transform:rotate(180deg);";
			}
			else {
				hand = "hand_ne";
				container.style.top = (posY-10) + "px";
				desc_style = "right:-10px; bottom:"+__bundles[hand][2];
				pointer_style = "position:absolute; bottom:-14px; right:5px;";
			}
			
			container.style.left = (posX - parseInt(__bundles[hand][1]) + 15) + "px";//15: so the tip of the finger is exact
		}
		
		
		createBundle(hand, container, false, "position:absolute");
		var bubble = appendElement("div", container, false, "border:3px solid white; border-radius:10px; background-color:#c9d7ec; font-size:9pt; padding:8px; margin:5px; width:300px; position:absolute;"+desc_style),
			desc = appendElement("div", bubble, {className:"content", innerText:description});
		appendElement("div", desc, {id:"bubblePointer"}, pointer_style);
		
		
		if(action !== false) {
			if(action === undefined) {
				action = "[Klicke auf die Meldung]";
				bubble.style.pointerEvents = "all";
				bubble.style.cursor = "pointer";
				
				this._set_click(container, Math.floor(this.index)+1);
			}
			
			action = appendElement("div", bubble, {textContent:action}, "font-size:small; font-weight:bold; text-align:center; margin-top:5px");
		}
		
		
		this._marker_container.appendChild(container);
		return [desc, action];
	},
	
	mark_element: function(el, description, pX, pY, action) {
		var rect = el.getBoundingClientRect(),
			win_width = window.innerWidth,
			win_height = window.innerHeight,
			hand, x, y, style;
		
		pX = (pX === undefined) ? 0.5 : pX;
		pY = (pY === undefined) ? 0.5 : pY;
		
		return this.mark_position(description, rect.left + rect.width*pX, rect.top + rect.height*pY, false, false, action);
	},
	
	step: function() {
		this._marker_container.innerHTML = "";
		switch(this.index) {
			case 0:
				this.mark_position("Dieser Button öffnet die Einstellungen von SeamapPlus.\nIn den Einstellungen kannst Du beispielsweise verändern, wie viele Inseln maximal im Cache gespeichert werden können.", 15, 42, false, true, false);
				
				if(!Minimap.hasCourse) {
					this._override(Minimap, "setCourse", this.index+0.2);
					this.mark_element(gid("seamap"), "", 0.3, undefined, "Setze einen Kurs auf der Seekarte um fortzufahren");
					break;
				}
			case 0.2:
				window.setTimeout(function() {Tutorial.mark_element(Minimap.travelTime_el, "Die Reisezeit-Anzeige deiner Insel wurde hierher verschoben. Darunter ist nun auch die Boost-Anzeige deiner Insel.", 0.8, 0.6);}, 300);
			break;
			case 1: case "minimap_hidden":
			this.index = 1;
				if(!Pref.minimap_enabled) {
					this._set_click(Minimap._minimap_div.firstChild, this.index+0.2);
					this.mark_element(Minimap._minimap_div.firstChild, "", undefined, undefined, "Blende die minimap ein");
					break;
				}
			case 1.2:
				this._set_click(Minimap._minimap_div.firstChild, "minimap_hidden");
				this._override(Minimap, "jump_worldTo", Math.floor(this.index)+1);
				this.mark_position("Das Herzstück von SeamapPlus ist die Weltkarte. Dort werden fremde Inseln, NPCs und vieles mehr dargestellt.", 150, 220, false, true, "Klicke auf einen bliebigen Ort in der WELTKARTE");
			break;
			case 2:
				this._set_click(Minimap._minimap_div.firstChild, "minimap_hidden");
				
				Tutorial.mark_element(gid("seamap"), "Durch das Klicken auf die Weltkarte springt die Seekarte dorthin. Inseln, welche auf Deiner Seekarte angezeigt sind, werden automatisch in Deiner Weltkarte eingezeichnet", 0.6, undefined, false);
				
				this.mark_element(Ship_data._state, "Diese Leiste zeigt Dir die Schiffs-Reisezeiten an. Durch das Ändern der Seekartenposition werden dir nun die Zeiten zum Mittelpunkt der SEEKARTE angezeigt.\nWenn Du auf dieses Symbol klickst, kannst Du zwischen Seekarten- und Weltkartenanzeige (Mittelpunkt der Weltkarte) wechseln.");
				
				this.mark_element(History._button_back, "Über die Pfeile kannst du zwischen den bisher angezeigten Seekartenpositionen hin und her springen.", undefined, undefined, false);
			break;
			case 3:
				this._set_click(Minimap._minimap_div.firstChild, "minimap_hidden");
				var el = Minimap._jumpToDest_button.nextSibling;
				this._set_click(el, this.index+1);
				this._set_click(Minimap._expand_button, this.index);
				
				this.mark_element(el, "", undefined, 0.5, "Klicke auf mit einem Linksklick auf den Home-Button");
				
				this.mark_element(Ship_data._main.firstChild, "Dieses Icon öffnet eine Übersicht über die Zeiten aller Schiffe von Escaria", undefined, undefined, false);
			break;
			case 4:
				this._set_click(Minimap._minimap_div.firstChild, "minimap_hidden");
				this._set_click(Minimap._expand_button, this.index);
				
				
				this.mark_element(gid("seamap"), "Dir ist vielleicht schon der zusätzliuchen Radius der Insel aufgefallen.\nDer äußerste Radius ganz zeigt dir, ab wo du angreifende Schiffe sehen kannst. Angreifende Truppen, welche den den hellen Bereich überschritten haben, sind vollständig sichtbar.", undefined, undefined, false);
				
				this.mark_element(Minimap._jumpToDest_button.nextSibling, "Die Seekarte ist nun zu der Position deiner Insel gesprungen. Der Button rechts (ausgeblendet, wenn die Insel steht) bringt Dich zu deiner Reisezielposition und der linke Button zu dem momentan auf der Seekarte angezeigten Bereich.\n\nChrome / Opera: Ein Linksklick bewegt immer die Seekarte und ein Mittelklick die Weltkarte.");
			break;
			case 5:
				this._set_click(Minimap._minimap_div.firstChild, "minimap_hidden");
				this._set_click(Minimap._expand_button, this.index);
				this.mark_element(Minimap._minimap_slider, "Über diesen Regler veränderst du den Zoom-Level der Weltkarte. Du kannst statt dem Regler aber auch das Mausrad verwenden.");
			break;
			case 6:
				this._set_click(Minimap._minimap_div.firstChild, "minimap_hidden");
				this._set_click(Minimap._expand_button, this.index);
				this.mark_element(Minimap._expand_button, "Wenn du die Weltkarte vergrößern möchtest, kannst Du entweder auf diesen Button oder mit der Maus doppelt auf die Weltkarte klicken.");
			break;
			case 7: case "sidebar_closed":
			this.index = 7;
				this._marker_container.parentNode.removeChild(this._marker_container);
				gid("seamap").appendChild(this._marker_container);
				
				if(!Sidebar.opened) {
					this._override(Sidebar, "make_list", this.index+0.2);
					
					this.mark_element(Sidebar._opener_button, "", undefined, undefined, "Öffne nun die Seitenleiste");
					break;
				}
			case 7.2:
				if(!Sidebar._content.childNodes.length) {
					this._override(Minimap, "update_island", this.index+0.2);
					this.mark_element(gid("seamap"), "", 0.6, undefined, "Springe mit der Seekarte zu einer Position, an der sich fremde Inseln befinden");
					break;
				}
			case 7.4:
				this._marker_container.parentNode.removeChild(this._marker_container);
				gid("game_widget").appendChild(this._marker_container);
				
				this._set_click(Sidebar._list_div.lastChild, "sidebar_closed");
				
				this.mark_element(Sidebar._displayed_area_icon, "Dieser Button listet die momentan auf der Seekarte angezeigten Inseln auf.", undefined, 0.6);
			break;
			case 8:
				this._set_click(Sidebar._list_div.lastChild, "sidebar_closed");
				
				this.mark_element(Sidebar._cache_icon, "Hier werden sämtliche Inseln aus dem seamapPlus-Cache aufgelistet.\n\nSeamapPlus speichert jede Insel im Cache, welche einmal auf deiner Seekarte angezeigt wurde. Je mehr Du also die Seekarte erkundigst, desto mehr Inseln landen in Deinem Cache.\n\nBeachte: Der Cache geht verloren, sobald die Seite neu geladen oder geschlossen wird.", undefined, 0.6);
			break;
			case 9:
				this._set_click(Sidebar._list_div.lastChild, "sidebar_closed");
				this._set_click(Sidebar._content.firstChild, this.index+1);
				
				this.mark_element(Sidebar._content.firstChild, "Die Seitenliste ist immer nach Gilden (und Alphabet) sortiert. Überfährst du einen Gildenreiter, werden alle Inseln dieser Gilde auf der Seekarte hervor gehoben.", 0.7, undefined, "Öffne diesen Gildenreiter");
			break;
			case 10:
				this._set_click(Sidebar._list_div.lastChild, "sidebar_closed");
				this._override(Sidebar, "_toggle_island_hide", this.index+1);
				
				this.mark_element(Sidebar._content.firstChild.nextSibling.firstChild, "Durch Überfahren mit der Maus wird die Insel auf der Seekarte hervor gehoben. Per Klick springt die Seekarte zu dessen Position (Chrome/Opera: Ein Mittelklick bewegt nur die Weltkarte).\nÜber die Checkbox neben dem Namen kannst du die Insel auf der SEEKARTE ausblenden.", 0.3, undefined, "Blende diese Insel über die Checkbox aus");
			break;
			case 11:
				this._set_click(Sidebar._list_div.lastChild, "sidebar_closed");
				this._set_click(Sidebar._hidden_isls_indicator, this.index+1);
				
				this.mark_element(Sidebar._hidden_isls_indicator, "Dieser Indikator zeigt dir an, wie viele Inseln seamapPlus momentan ausblendet.\nKlickst du auf den Indikator werden sämtliche Inseln wieder angezeigt", 0.3, 0.7, "Klicke auf den Indikator");
			break;
			case 12:
				this._set_click(Sidebar._list_div.lastChild, "sidebar_closed");
				this.mark_element(Sidebar._search_field, "Über dieses Suchfeld kann die Seitenleiste nach Inselnamen gefiltert werden");
			break;
			case 13: case "ringmenu_closed":
			this.index = 13;
				this._marker_container.parentNode.removeChild(this._marker_container);
				gid("seamap").appendChild(this._marker_container);
				
				this._override(Ringmenu, "reset_ringmenu", this.index+1);
				this.mark_element(gid("seamap"), "", 0.6, 0.8, "Klicke in der Seekarte auf eine fremde Insel");
			break;
			case 14:
				this._override(Ringmenu, "check", "ringmenu_closed");
				this._override(Minimap, "add_listItem", this.index+1);
				
				if(Ringmenu._ringmenu_player_inserted)
					this.mark_element(Ringmenu._ringmenu_button_player, "Du findest bei den Spielerprofilbuttons des Ringmenüs neue Zusatzbuttons mit denen du Inseln und Gilden auf der Weltkarte markieren kannst.", undefined, 0.6, "Markiere diese Insel");
				else {
					var desc = this.mark_element(Ringmenu._item_playerProfile, "Du findest bei den Spielerprofilbuttons des Ringmenüs neue Zusatzbuttons mit denen du Inseln und Gilden auf der Weltkarte markieren kannst.", 0.6, 0.6, "Markiere eine Insel über den ");
					appendElement("img", desc[1], {src:__release+"/gfx/icons/logbook_tile_icon_small_0.png", alt:"Insel"}, "vertical-align:middle");
					desc[1].innerHTML += "-Button";
				}
					
					this.mark_element(Ship_data._state, "Du hast gerade das Ringmenü geöffnet. Die Schiffszeiten beziehen sich nun auf die von Dir geklickten Position", undefined, undefined, false);
			break;
			case 15:
				var el = document.body.lastChild.lastChild.lastChild.lastChild,
					close = el.previousSibling,
					button = el.lastChild.lastChild; //has to be first because of lastChild
				
				this._set_click(close, "ringmenu_closed");
				this._set_click(button, this.index+1);
				
				this.mark_element(button, "", undefined, undefined, "Wähle eine Farbe und klicke auf \"hinzufügen\"");
				
			break;
			case 16: case "no_player_menu":
			this.index = 16;
				if(!Pref.minimap_enabled) {
					this._set_click(Minimap._minimap_div.firstChild, this.index+0.2);
					this.mark_element(Minimap._minimap_div.firstChild, "", undefined, undefined, "Blende die minimap ein");
					break;
				}
			case 16.2:
				this.mark_element(Minimap._viewpoint, "Die gewählte Insel wird nun auf See- und Weltkarte farbig markiert");
			break;
			case 17:
				if(!Pref.list_enabled) {
					var el = Minimap._fav_main_div.firstChild;
					this._set_click(el, this.index+0.2);
					this.mark_element(el, "", undefined, undefined, "Öffne das Zusatzmenü");
					break;
				}
			case 17.2:
				if(Minimap._fav_main_div.className != "GM_list GM_fav") {
					this._override(Minimap, "switch_favList", this.index+0.2);
					this.mark_element(getEl("//img[@class='GM_clickable GM_switcher']").snapshotItem(0), "", undefined, undefined, "Wechsle in das Favoritenmenü");
					break
				}
			case 17.4:
				//has to happen first:
				Minimap.switch_favList("marks_player");
				
				this._set_click(Minimap._minimap_div.firstChild, "no_player_menu"); //minimap-hidden
				this._override(Minimap, "switch_filterList", "no_player_menu"); //filter-menu
				this._set_click(Minimap._fav_main_div.firstChild, "no_player_menu"); //hidden
				this._set_click(Minimap._positions_listItem, "no_player_menu");
				this._set_click(Minimap._marks_guild_listItem, "no_player_menu");
				this._set_click(Minimap._expand_button, this.index);
			
				this.mark_element(Minimap._list, "In dieser Liste befinden sich alle Spieler, die Du markiert hast. Mit einem Klick auf deren Namen, kannst Du direkt zu deren Position springen", 0.8, 0.1);
			break;
			case 18:
				this._set_click(Minimap._minimap_div.firstChild, "no_player_menu"); //minimap-hidden
				this._override(Minimap, "switch_filterList", "no_player_menu"); //filter-menu
				this._set_click(Minimap._fav_main_div.firstChild, "no_player_menu"); //hidden
				this._set_click(Minimap._expand_button, this.index);
				
				var desc = this.mark_element(Minimap._marks_guild_listItem, "Du kannst über den ");
				appendElement("img", desc[0], {src:__release+"/gfx/icons/logbook_guild_icon_small_0.png", alt:"Gilden"}, "vertical-align:middle");
				desc[0].innerHTML += "-Button im Ringmenü auch die Spieler von Gilden farbig hervorheben.";
			break;
			case 19: case "no_positions_menu":
			this.index = 19;
				this._set_click(Minimap._minimap_div.firstChild, "no_player_menu"); //minimap-hidden
				this._override(Minimap, "switch_filterList", "no_player_menu"); //filter-menu
				this._set_click(Minimap._fav_main_div.firstChild, "no_player_menu"); //hidden
				this._set_click(Minimap._expand_button, this.index);
				
				this._set_click(Minimap._positions_listItem, this.index+1);
				this.mark_element(Minimap._positions_listItem, "", undefined, undefined, "Wechsle zum Positionen-Reiter");
			break;
			case 20:
				this._set_click(Minimap._minimap_div.firstChild, "no_player_menu"); //minimap-hidden
				this._override(Minimap, "switch_filterList", "no_player_menu"); //filter-menu
				this._set_click(Minimap._fav_main_div.firstChild, "no_player_menu"); //hidden
				this._set_click(Minimap._marks_player_listItem, "no_positions_menu");
				this._set_click(Minimap._marks_guild_listItem, "no_positions_menu");
				this._set_click(Minimap._expand_button, this.index);
				
				this.mark_element(getEl(".//div[@class='GM_clickable GM_plus_button']", Minimap._fav_main_div).snapshotItem(0), "Über diesen Button kannst du die momentane Position der Seekarte speichern.");
			break;
			case 21:
				this._set_click(Minimap._minimap_div.firstChild, "no_player_menu"); //minimap-hidden
				this._override(Minimap, "switch_filterList", "no_player_menu"); //filter-menu
				this._set_click(Minimap._fav_main_div.firstChild, "no_player_menu"); //hidden
				this._set_click(Minimap._marks_player_listItem, "no_positions_menu");
				this._set_click(Minimap._marks_guild_listItem, "no_positions_menu");
				this._set_click(Minimap._expand_button, this.index);
				
				this.mark_element(getEl(".//img[@class='GM_clickable GM_switcher']", Minimap._fav_main_div).snapshotItem(0), "Hier kannst Du diverse Anzeige-Einstellungen der Weltkarte verändern und bestimmen was ein- oder ausgeblendet werden soll");
			break;
			case 22:
				this.mark_position("Ich hoffe, diese Funktionen können Dir beim Inseln helfen.\nIch wünsche Dir noch viel Spaß mit seamapPlus! :)\nJodli\n\nPs\nDu kannst dieses Tutorial jederzeit wieder über die Einstellungen starten.", 15, 42, false, true);
				break
			case 23:
				this.stop(true);
		}
		
		this._bar_progress.style.width = (100 / this.max) * this.index + "%";
		this._status_box.textContent = Math.floor(this.index);
	}
}

History = {
	_positions: [[0,0]],
	_index: 0,
	_only_one: true,
	disabled: false,
	
	_button_back:null,
	_button_next:null,
	
	init: function(parent) {
		var div = appendElement("div", parent, false, "position:absolute; left:0; top:2px; vertical-align:top; margin-right:5px; margin-top:-3px; display:inline-block")
		this._button_back = createBundle("arrow_left_medium", div, {title:"Im Verlauf zur vorherigen Position springen", className:"GM_clickable"}, "display:inline-block; opacity:0.5");
		this._button_next = createBundle("arrow_right_medium", div, {title:"Im Verlauf zur nächsten Position springen", className:"GM_clickable"}, "display:inline-block; opacity:0.5");
		
		EventBox.bind(this._button_back, "mouseup", this.back, false, this);
		EventBox.bind(this._button_next, "mouseup", this.next, false, this);
	},
	add: function(pos, only_one) {
		if(this.disabled) {
			var current_pos = this._positions[this._index];
			if(current_pos[0] == pos[0] && current_pos[1] == pos[1])
				this.disabled = false;
			return;
		}
		
		if(only_one) {
			if(this._only_one) {
				this._positions[this._positions.length-1] = pos;
				return;
			}
			else
				this._only_one = true;
		}
		else if(this._only_one)
			this._only_one = false;
		
		this._button_back.style.opacity = 1;
		
		
		if(this._positions.length > this._index+1) {
			this._positions[++this._index] = pos;
			this._positions.splice(this._index+1);
			this._button_next.style.opacity = 0.5;
		}
		else {
			this._index = this._positions.push(pos)-1;
			
			if(this._index > Pref.history_max) {
				this._positions.splice(0, this._index - Pref.history_max);
				this._index = Pref.history_max;
			}
		}
	},
	
	back: function() {
		if(!this._index)
			return;
		else if(!--this._index)
			this._button_back.style.opacity = 0.5;
		
		
		this._button_next.style.opacity = 1;
		
		this.disabled = true;
		this._only_one = false;
		
		var pos = this._positions[this._index];
		Minimap.jump_worldTo(pos[0], pos[1]);
	},
	next: function() {
		if(this._index+1 >= this._positions.length)
			return;
		else if(++this._index +1 >= this._positions.length)
			this._button_next.style.opacity = 0.5;
		
		
		this._button_back.style.opacity = 1;
		
		this.disabled = true;
		this._only_one = false;
		
		var pos = this._positions[this._index];
		Minimap.jump_worldTo(pos[0], pos[1]);
	}
}
Data = {
	isl_div: null,
	myUsername: null,
	myX: 0,
	myY: 0,
	myGuild: null,
	
	_last_worldX: 0,
	_last_worldY: 0,
	
	_cache_num: 0,
	islands:{},
	guilds:{},
	npc: {},
	
	
	STAYS: 0,
	RIGHT: 1,
	RIGHT_DOWN: 45,
	DOWN: 90,
	LEFT_DOWN: 135,
	LEFT: 180,
	LEFT_UP: 225,
	UP: 270,
	RIGHT_UP: 315,
	
	handle_islandId: function(el) {
		if(el.id)
			return ((el.id=='GM_seamapPlus_El') ? false : el.id);//Workaround
		el.id='GM_seamapPlus_El';
		var script=appendElement('script', document.body, {type:'application/javascript', textContent:'var el=document.getElementById("GM_seamapPlus_El"); el.id=el.islandId; delete el;'});
		document.body.removeChild(script);
		return ((el.id=='GM_seamapPlus_El') ? false : el.id);//Workaround
	},
	get_isl_pos: function(el) {
		var left = parseInt(el.style.left.slice(0,-2)),
			top = parseInt(el.style.top.slice(0,-2)),
			sizeEl = el.firstChild.lastChild,
			size;
		
		if(Minimap.world_isZoomed) {
			left = left*2;
			top = top*2;
		}
		
		while(sizeEl.className.slice(-12)!='islandsImage')
			sizeEl=sizeEl.previousSibling;
		size = sizeEl.style.width.slice(0,-2);
		
		return [Math.round(Minimap.worldX + left + size/2), Math.round(Minimap.worldY + top + size/2)];
	},
	get_isl_nation: function(el) {
		var picEl = el.firstChild.lastChild;
		while(picEl.className.slice(-12) != "islandsImage")
			picEl = picEl.previousSibling;
	
		var backPos = picEl.style.backgroundPosition,
			dive = false;
		
		switch(backPos) {
			case __bundles.romans_dive[3]:
			case __bundles.romans_zoom_dive[3]:
				dive = true;
			case __bundles.romans[3]:
			case __bundles.romans_zoom[3]:
				var nation = ROMANS;
			break;
			case __bundles.vikings_dive[3]:
			case __bundles.vikings_zoom_dive[3]:
				dive = true;
			case __bundles.vikings[3]:
			case __bundles.vikings_zoom[3]:
				var nation = VIKINGS;
			break;
			case __bundles.aztecs_dive[3]:
			case __bundles.aztecs_zoom_dive[3]:
				dive = true;
			case __bundles.aztecs[3]:
			case __bundles.aztecs_zoom[3]:
				var nation = AZTECS;
			break;
			default:
				var nation = UNKNOWN;
		}
		return [nation, dive];
	},
	set_myPos: function(el) {
		var pos = this.get_isl_pos(el);
		pos = Minimap.calc_map_pos(this.myX = pos[0], this.myY = pos[1]);
		Minimap.own_island.setAttributeNS(null, "x", pos[0]);
		Minimap.own_island.setAttributeNS(null, "y", pos[1]);
	},
	set_myGuild: function(g) {
		if(Init.in_progress) {
			this.myGuild = g;
			return;
		}
		
		if(!this.myGuild) {
			if((this.myGuild = g)) {//joined guild
				Chat.init();
				Init._move_worldmapData();
			}
		}
		else {
			if(g != this.myGuild) {//left guild or guild changed
				var guild = this.guilds[this.myGuild],
					update_island = Minimap.update_island;
				for(var i in guild) {
					guild[i].dipl = false;
					Minimap.update_island(guild[i]);
				}
				
				if(g) { //changed guild
					this.myGuild = false; //littly hacky
					this.set_myGuild(g);
					return;
				}
			}
			this.myGuild = g;
		}
	},
	check_cache: function() {
		var isls = this.islands,
			npcs = this.npc,
			prefs = Pref,
			isl, el, i;
		if(prefs.cacheMax && ++this._cache_num > prefs.cacheMax) {
			for(i in npcs) {
				Minimap.remove_npc(npcs[i]);
				el = gid(npcs[i].id);
				if(el)
					el.removeAttribute("GM_seamapPlus_checked");
				delete npcs[i];
				if((--this._cache_num) < prefs.cacheMax)
					return;
			}
			for(i in isls) {
				isl = isls[i];
				if((!prefs.cache_save_friends || isl["dipl"] != FRIEND) && (!prefs.cache_save_ally || isl["dipl"] != ALLY) && (!prefs.cache_save_enemys || isl["dipl"] != ENEMY) && (!prefs.cache_save_marked || (!Pref.marks_guild[isl["guild"]] && !Pref.marks_player[isl["user"]]))) {
					Minimap.remove_island(isl);
					this.remove_from_guilds(isls[i]);
					el = gid(isl.id);
					if(el)
						el.removeAttribute("GM_seamapPlus_checked");
					delete isls[i];
					
					if((--this._cache_num) < prefs.cacheMax)
						return;
				}
			}
			GM_log('seamapPlus: Cache voll, aber keine Insel zum loeschen!');
		}
	},
	check_again: function() {
		window.setTimeout(function() {Minimap.loop_islands();}, Pref.delay_time);
	},
	gather_npcData: function(el, id) {
		data_el = toChild(el,3);
		
		var isl = this.npc[id],
		pos = this.get_isl_pos(el);
		isl.x = pos[0];
		isl.y = pos[1];
		
		//###hf-dir
		//var backPos = dir.style.backgroundPosition.match(/^-(\d+)px/)[1],
			//bundlePos = __bundles.hf[3].match(/^-(\d+)px/)[1];
		//switch(backPos) {
			//case bundlePos:
				//isl.dir = UP;
			//break
			//case (bundlePos+:
		//}
		return isl;
	},
	
	remove_from_guilds: function(isl) {
		var g = this.guilds[isl.guild],
			i = g.length;
		
		if(i==1)
			delete this.guilds[isl.guild];
		else {
			while(i--) {
				if(g[i] != isl)
					continue;
				
				g.splice(i,1);
				break;
			}
		}
	},
	mark_island_level: function(isl, el, min, max) {
		if(isl.highlevel = (isl.lvl > max)) {
			var lvl_el = data_el.childNodes[1];
			lvl_el.style.backgroundColor = "red";
			lvl_el.style.border = "1px solid white";
			lvl_el.className = "GM_island_marked";
			isl.lowlevel = false;
		}
		else if(isl.lowlevel = (isl.lvl < min)) {
			var lvl_el = data_el.childNodes[1];
			lvl_el.style.backgroundColor = "YellowGreen";
			lvl_el.style.border = "1px solid white";
			lvl_el.className = "GM_island_marked";
			isl.highlevel = false;
		}
	},
	gather_islandData: function(el, user) {
		data_el = toChild(el,3);
		
		var isl = this.islands[user],
			pos = this.get_isl_pos(el);
		
		isl.x = pos[0];
		isl.y = pos[1];
		
		//guild
		if(!(guild = data_el.lastChild.firstChild.textContent).length)
			guild = __locale.noGuild;
		if(guild != isl.guild) {
			if(!this.guilds.hasOwnProperty(guild))
				this.guilds[guild] = [isl];
			else
				this.guilds[guild].push(isl);
			
			if(isl.guild)//fresh islands
				this.remove_from_guilds(isl);
		
			isl.guild = guild;
		}
		if(Pref.marks_guild.hasOwnProperty(guild)) {//will also be done when rechecking
			data_el.lastChild.style.backgroundColor = Pref.marks_guild[guild];
			data_el.lastChild.className = "GM_island_marked";
		}
		
		isl.lvl = parseInt(toChild(el,4).nextSibling.firstChild.textContent.slice(2, -1));
		
		
		//highlevel
		var hs = Hs_tree.get_value(isl.x, isl.y);
		if(hs[0]) {
			var value = hs[1];
			this.mark_island_level(isl, el, Math.max(value[0], Pref.lowlevel), Math.min(value[1], Pref.highlevel));
		}
		else
			this.mark_island_level(isl, el, Pref.lowlevel, Pref.highlevel);
		
		
		//Politische Beziehung
		if(el.firstChild.lastChild.className == "islandAlignmentIndicator") {
			switch(el.firstChild.lastChild.style.backgroundPosition) {
				case __bundles.friend[3]:
				case __bundles.friend_zoom[3]:
					isl.dipl = FRIEND;
				break;
				case __bundles.ally[3]:
				case __bundles.ally_zoom[3]:
					isl.dipl = ALLY;
				break;
				case __bundles.enemy[3]:
				case __bundles.enemy_zoom[3]:
					isl.dipl = ENEMY;
				break;
			}
		}
		else
			isl.dipl = false;
		
		var dir
		if((dir=el.firstChild.firstChild.nextSibling).className=="islandsDirection" || (dir=el.firstChild.lastChild).className=="islandsDirection") {
			switch(dir.style.backgroundPosition) {
				case __bundles.arrow_east[3]:
					isl.dir = this.RIGHT;
				break;
				case __bundles.arrow_south_east[3]:
					isl.dir = this.RIGHT_DOWN;
				break;
				case __bundles.arrow_south[3]:
					isl.dir = this.DOWN;
				break;
				case __bundles.arrow_south_west[3]:
					isl.dir = this.LEFT_DOWN;
				break;
				case __bundles.arrow_west[3]:
					isl.dir = this.LEFT;
				break;
				case __bundles.arrow_north_west[3]:
					isl.dir = this.LEFT_UP;
				break;
				case __bundles.arrow_north[3]:
					isl.dir = this.UP;
				break;
				case __bundles.arrow_north_east[3]:
					isl.dir = this.RIGHT_UP;
				break;
			}
		}
		else {
			isl.dir = this.STAYS;
		}
		
		isl.boost = false;
		for(var t_el = el.firstChild.childNodes, i=1, t_el_len=t_el.length; i<t_el_len; ++i) {
			if(t_el[i].className.substr(0,5)=="foam_") {
				isl.boost = true;
				break;
			}
		}
		switch(toChild(data_el,2).style.color) {
			case "#F8820F":
			case "rgb(248, 130, 15)":
			case "#DB1F26":
			case "#DB1F26":
				isl.attack = true;
			break;
			default:
				t_el = el.firstChild.lastChild.previousSibling;
				while(t_el.className!="extendedHTML killableStatusIcon")
					t_el = t_el.previousSibling;
				isl.attack = !(t_el.style.display=="none");
		}
		
		return isl;
	},
	
	check_map: function() {
		Ringmenu.update_world_pos();
		
		if(this._last_worldX != Minimap.worldX || this._last_worldY != Minimap.worldY) {
			if(Minimap.world_isZoomed)
				History.add([Minimap.worldX + window.innerWidth, Minimap.worldY + window.innerHeight], true);
			else
				History.add([Minimap.worldX + Math.floor(window.innerWidth/2), Minimap.worldY + Math.floor(window.innerHeight/2)], true);
			
			this._last_worldX = Minimap.worldX;
			this._last_worldY = Minimap.worldY;
			
			Minimap.jump_mapTo(Minimap.worldX, Minimap.worldY);
			this.loop_islands();
			Ship_data.update(Ship_data.SEAMAP);
		}
	},
	
	reset_island_level: function() {
		var els = this.isl_div.childNodes,
			i = els.length;
		
		while(i--) {
			lvl_el = toChild(els[i],3).childNodes[1];
		
			lvl_el.style.backgroundColor = "transparent";
			lvl_el.style.border = "none";
			lvl_el.className = "";
		}
	},
	loop_islands: function() {
		var els = this.isl_div.childNodes,
			i = els.length,
			hidden_isls = Sidebar.hidden_isls,
			el, isl,
			data_el, user, id, type, nation, dive,
			r, lvl, pos;
		
		while(i--) {
			el = els[i];
			
			if(el.hasAttribute("GM_seamapPlus_checked")) {
				if(el.hasAttribute("GM_seamapPlus_ignore"))
					continue;
				
				data_el = toChild(el,3);
				id = el.id;
				if(id == this.myId) {
					this.set_myPos(el);
					this.set_myGuild(data_el.lastChild.firstChild.textContent);
					continue;
				}
				if(this.npc.hasOwnProperty(id))
					Minimap.update_npc(this.gather_npcData(el, id));
				else {
					Minimap.update_island(this.gather_islandData(el, toChild(data_el,2).textContent));
				}
				
				continue;
			}
			el.setAttribute("GM_seamapPlus_checked", 1);
			
			
			if(!el.hasChildNodes() || !el.firstChild.hasChildNodes()) { //Schiffe
				//if(el.hasChildNodes()) {//###fremde Schiffe
				//}
				el.setAttribute("GM_seamapPlus_ignore", 1);
				continue
			}
			
			id = this.handle_islandId(el);
			if(!id) {//bei grosser Engine-Auslastung werden injected Scripts zu spaet ausgefuehrt -> Workaround..
				el.removeAttribute("GM_seamapPlus_checked");
				this.check_again();
				continue;
			}
			data_el = toChild(el,3);
			
			
			if(id == this.myId) { //me
				this.set_myPos(el);
				this.set_myGuild(data_el.lastChild.firstChild.textContent);
				
				Radius.draw(el);
				continue;
			}
			
			user = toChild(data_el,2).textContent;
			type = id.split(":")[0];
			
			
			if(hidden_isls[user]) //Sidebar-hide
				el.style.display = "none";
			
			if(type == "trade_island") {//hs
				el.setAttribute("GM_seamapPlus_ignore", 1);
				pos = this.get_isl_pos(el);
				
				if(!(r = Hs_tree.get_value(pos[0], pos[1]))[0]) {
					if(!(lvl =user.match(/.+\((\d+)-(\d+)\)/))) //if hs has no level
						continue;
					Hs_tree.add(r[1], r[2], pos[0], pos[1], [lvl[1], lvl[2]]);
				}
				//we have to check islands again because of highlevel
				this.loop_islands();
				return;
			}
			else if(type=="resource_spending_spring") {
				el.setAttribute("GM_seamapPlus_ignore", 1);
				continue;
			}
			
			
			
			
			if(!(type == "island")) { //npc
				if(!this.npc.hasOwnProperty(id)) {
					switch(type) {
						case "merchantfleet":
							if(el.firstChild.lastChild.style.backgroundPosition == __bundles.merchant_destroyed[3]) {
								el.setAttribute("GM_seamapPlus_ignore", 1);
								continue; //destroyed - we dont need it
							}
							nation = MERCHANT;
							
						break;
						case "kraken":
							nation = KRAKEN;
						break;
						default:
							nation = UNKNOWN;
							
					}
					this.check_cache();
					isl = this.npc[id] = {user:user, id:id, nation:nation, npc:true, x:0, y:0};
					Minimap.add_npc(isl);
				}
				isl = this.gather_npcData(el, id);
				Minimap.update_npc(isl);
				continue;
			}
			else if(!this.islands.hasOwnProperty(user)) {
				nation = this.get_isl_nation(el); //[nation, dive]
				
				this.check_cache();
				isl = this.islands[user] = {user:user, id:id, nation:nation[0], npc:false, guild:false, x:0, y:0, dive:nation[1], name_el:false, dir_el:false};
				Minimap.add_island(isl);
			}
			
			if(Pref.marks_player.hasOwnProperty(user)) {//marks_player
				data_el.firstChild.style.backgroundColor = Pref.marks_player[user];
				data_el.firstChild.className = "GM_island_marked";
			}
			isl = this.gather_islandData(el, user);
			Minimap.update_island(isl);
			
			
		}
		Sidebar.update();
	}
}
Hs_tree = {
	_container: [],//[xmin, ymin, xmax, ymax, [*xmin_ymin, *xmin_ymax, *xmin_y=, *xmax_ymin, *xmax_ymax, *xmax_y=, *x=_ymin, *x=_ymax], [v1, v2]]
	get_value: function(x, y) {
		var l = this._container.length,
			c=null, c2 = this._container[0],
			y_test;
		
		while(c2) {
			c=c2;
			y_test = (y < c[1]) ? 0 : ((y > c[3]) ? 1 : 2);
			
			if(x < c[0])
				c2 = c[4][y_test];
			else if(x > c[2])
				c2 = c[4][y_test+=3];
			else {//==
				if(y_test == 2)
					return [true, c[5]];//found
				else
					c2 = c[4][y_test+=6];
			}
		}
		
		return [false, c, y_test];
	},
	add: function(c, y_test, x, y, v) {
		var c_len = this._container.push([x-2000, y-2000, x+2000, y+2000, [false, false, false, false, false, false, false, false], v]);
		if(c)
			c[4][y_test] = this._container[c_len-1];
	}
}

function hashchange() {
	var h = window.location.hash,
		pos = h.match(/seamap\((-?\d+),(-?\d+)\)/);
	
	if(pos) {
		if(Minimap.world_isZoomed) {
			var x = pos[1]- window.innerWidth,
				y = pos[2]- window.innerHeight;
		}
		else {
			var x = pos[1]- Math.floor(window.innerWidth/2),
				y = pos[2]- Math.floor(window.innerHeight/2);
		}
		History.add([pos[1], pos[2]]);
		Data._last_worldX = x;
		Data._last_worldY = y;
		
		
		window.setTimeout(function() {
			Minimap.jump_mapTo(x, y);
			//if(Minimap.world_isZoomed)
				//Minimap.jump_mapTo(pos[1]- window.innerWidth, pos[2]- window.innerHeight);// zoomed: innerX*2 -> innerX*2/2 == innerX
			//else
				//Minimap.jump_mapTo(pos[1]- Math.floor(window.innerWidth/2), pos[2]- Math.floor(window.innerHeight/2));
			
			Data.loop_islands();
			
			window.location.hash="seamap";
			Ship_data.update(Ship_data.SEAMAP);
		}, Pref.delay_time);
	}
	else if(h != "#seamap") {
		__disabled = true;
		return;
	}
	__disabled = false;
}
function mouseup(e) {
	//if(__disabled) {
		//if(window.location.hash == "#logbook") {
			//var tr = e.GM_target.parentNode.parentNode.parentNode;
			//if(tr.className == "unreadMessage") {
				//var msg = tr.childNodes[3].firstChild.lastChild.firstChild;
				//if(!msg.innerHTML)
					//return;
				//msg = msg.innerHTML;
					//console.log(msg);
				//if(msg.slice(0,11) == "seamapPlus:") {
					//console.log(msg.slice(11));
					//var positions = JSON.parse(msg.slice(11));
					//console.log(positions);
					//
					//var i = positions.length;
					// /*
					//while(i--) {
						//Minimap.addPosition
					//}*/
				//}
			//}
		//}
		//return;
	//}
	Ringmenu.check();
	Data.check_map();
}


//**********
//elements
//**********

Chat = {
	init:function() {
		if(!Data.myGuild)
			return;
		var chat_panel = gid("chatPanel").getElementsByTagName("tbody"),
			observer = new MutationObserver(this.new_chat);
		observer.observe(chat_panel[1], {childList:true});
		
		
		this._player_fu = EventBox.bind(false, "mouseup", function() {Minimap.jump_toPlayer(this.textContent.substr(0, this.textContent.length-1));});
		this._msg_fu = EventBox.bind(false, "mouseup", this.chat_jump);
		
		
		
		var td = appendElement("td", false, false, "width:60px");
		EventBox.bind(
				appendElement("img", td, {className:"GM_clickable", src:__release+"gfx/icons/inspect_icon_1.png", title:"Momentane Seekartenposition in Chat einfügen"}, "position:absolute; top:-3px; height:20px"),
				"mouseup", function() {
					this.parentNode.nextSibling.firstChild.value += "["+Minimap.worldX+", "+Minimap.worldY+"]";
				});
		EventBox.bind(
				appendElement("img", td, {className:"GM_clickable", src:__release+"gfx/icons/home_icon_small_0.png", title:"Momentane Inselposition in Chat einfügen"}, "position:absolute; top:-3px; left:20px; height:20px"),
				"mouseup", function() {
					this.parentNode.nextSibling.firstChild.value += "["+Data.myX+", "+Data.myY+"]";
				});
		EventBox.bind(
				appendElement("img", td, {className:"GM_clickable", src:__release+"gfx/icons/move_island_icon_small_0.png", title:"Momentane Reisezielposition in Chat einfügen"}, "position:absolute; left:40px; top:-3px; height:20px"),
				"mouseup", function() {
					if(Minimap.hasCourse)
						this.parentNode.nextSibling.firstChild.value += "["+Minimap.calc_world_pos(Minimap.destX, Minimap.destY).join(",")+"]";
				});
		
		chat_panel[2].firstChild.insertBefore(td, chat_panel[2].firstChild.firstChild);
	},
	new_chat: function(ms) {
		var bind_fu = EventBox.bind_fu, 
			player_fu = Chat._player_fu,
			msg_fu = Chat._msg_fu;
		
		ms.forEach(function(m) {
				var i = m.addedNodes.length,
					el, parts, max, j, s;
				
				while(i--) {
					el = m.addedNodes[i];
					
					bind_fu(el.firstChild.firstChild, "mouseup", player_fu);
					el.firstChild.style.cursor = "pointer";
					
					el = el.lastChild.firstChild;
					
					parts = el.textContent.split(/(\[[^\[\]]+)\]/g);
					el.innerHTML = "";
					
					for(max=parts.length, j=0; j<max; ++j) {
						s = parts[j];
						if(s.startsWith("["))
							bind_fu(appendElement("span", el, {textContent:s+"]", className:"GM_clickable", title: "Dorthin springen"}, "text-decoration:underline"), "mouseup", msg_fu);
						else 
							el.appendChild(document.createTextNode(s));
					}
				}
			});
	},
	chat_jump: function() {
		var s = this.textContent,
			pos;
		if((pos = s.match(/\[(\d+),(\d+)/)))
			Minimap.jump_worldTo(pos[1], pos[2]);
		else
			Minimap.jump_toPlayer(s.substring(1, s.length-1));
	},
	

}

Radius = {
	s_radius:0,
	e_radius:0,
	
	calc_radius: function() {
		if(!Pref.radius)
			return;
		var p = 0,
			tower = getEl("./div[1]/div[@class='foreground']//div[contains(@title, 'Spähturm')]", gid("island")),
			i = tower.snapshotLength,
			l;
		while(i--) {
			l = parseInt(tower.snapshotItem(i).title.match(/Spähturm\((\d+)\)/)[1]);
			p += l*l;
		}
		this.s_radius = Math.ceil(Math.sqrt(p)*15 + 720);
		this.e_radius = Math.ceil(this.s_radius*0.75);
		
		window.setTimeout(Radius.calc_radius, 1000*60*5);
	},
	draw: function(el) {
		if(!Pref.radius)
			return;
		var minimap = Minimap,
			indicators = appendElement("div", false, false, "position:absolute; left:-"+this.s_radius+"px; top:-"+this.s_radius+"px; margin-top:50%; margin-left:50%"),
			svg = minimap.appendElementNS("svg", indicators, {width: this.s_radius*2, height: this.s_radius*2});
		
		minimap.appendElementNS("circle", svg, {
				cx: this.s_radius,
				cy: this.s_radius,
				r: this.s_radius-1,
				fill: "#fff",
				"fill-opacity": 0.08,
				"stroke-opacity": 0.4,
				stroke: "#000000",
				"stroke-width":2,
				"stroke-dasharray": "8,6,2,6"});
		minimap.appendElementNS("circle", svg, {
				cx: this.s_radius,
				cy: this.s_radius,
				r: this.e_radius-1,
				fill: "#000",
				"fill-opacity": 0.08,
				"stroke-opacity": 0.4,
				stroke: "#000000",
				"stroke-width":2,
				"stroke-dasharray": "8,6,2,6"});
		
		el.appendChild(indicators);
	}
}

Minimap = {
	FAV: 1,
	FILTER:2,
	
	destX:0,
	destY:0,
	hasCourse: false,
	_svgDefs:null,
	_viewpoint:null,
	_minimap_slider:null,
	_minimap_slider_arrow:null,
	
	_list: null,
	_positions_listItem: null,
	_marks_guild_listItem: null,
	_marks_player_listItem: null,
	_active_favList: "positions",
	_active_filterList: null,
	
	_mapX: 0,
	_mapY: 0,
	
	_map_view_width: 180,
	_map_view_height: 180,
	
	_viewPoint_width:0, 
	_viewPoint_height:0, 
	
	_minimap_zoom_percent:1,
	_minimap_pos_minX:0,
	_minimap_pos_minY:0,
	_minimap_pos_maxX:0,
	_minimap_pos_maxY:0,
	
	_worldmap_width:0,
	_worldmap_height:0,
	_worldmap_middleX:0,
	_worldmap_middleY:0,
	_worldmap_stepX:0,
	_worldmap_stepY:0,
	
	_stopCource_ID: null,
	
	_minimap_div: null,
	chart_islands:null,
	chart:null,
	dest_icon: null,
	worldX:0,
	worldY:0,
	world_isZoomed: false,
	
	create: function(map_url, map_data) {
		this._map_view_width = Pref.minimap_width;
		this._map_view_height = Pref.minimap_height;
		
		map_data=map_data.split(',');
		
		var prozentX= 100 / (map_data[2]/Math.abs(map_data[0])),
			prozentY= 100 / (map_data[3]/Math.abs(map_data[1]));
		
		this._worldmap_width= map_data[4];
		this._worldmap_height= map_data[5];
	
		this._worldmap_middleX= (this._worldmap_width/100)*prozentX;
		this._worldmap_middleY= (this._worldmap_height/100)*prozentY;
		this._worldmap_stepX= this._worldmap_middleX/Math.abs(map_data[0]);
		this._worldmap_stepY= this._worldmap_middleY/Math.abs(map_data[1]);
		
		
		this._minimap_zoom_percent = Pref.minimap_zoom;
		
		this._minimap_pos_maxX = -this._map_view_width/2;
		this._minimap_pos_maxY = -this._map_view_height/2;
		this._minimap_pos_minX = -(this._worldmap_width*this._minimap_zoom_percent)+this._map_view_width/2;
		this._minimap_pos_minY = -(this._worldmap_height*this._minimap_zoom_percent)+this._map_view_height/2;
		
		
		//
		//map
		//
		
		this._minimap_div = appendElement("div", false, {className: (Pref.minimap_enabled ? "GM_minimap" : "GM_minimap hidden")});
		var minimap_toggle = appendElement("div", this._minimap_div, {textContent: "Minimap", className:"GM_clickable", title:"Karte verstecken / einblenden"}, "display:inline-block; margin-left:5px; font-size:small; font-weight:bold;"),
			minimap_main = appendElement("div", this._minimap_div, {className:"GM_minimap_main"});
		
		EventBox.bind(minimap_toggle, "mouseup", this.toggle_hide, false, this);
		EventBox.cloneEvents([
				createBundle("mini", minimap_toggle, {className:"GM_mini"}, "margin-left:5px;"),
				createBundle("maxi", minimap_toggle, {className:"GM_maxi"}, "margin-left:10px;")],
				["mouseup"], minimap_toggle);
		
		
		
		this._map = this.appendElementNS("svg", false, {width: this._map_view_width, height: this._map_view_height});
		this._map.style.cssText = "overflow:hidden; border:1px inset #46300D; border-radius:10px 10px 10px 10px; margin:5px;";
		
		this._svgDefs = this.appendElementNS("defs", this._map);
		this._set_pattern("npc_map0");
		this._set_pattern("npc_map1");
		this._set_pattern("npc_map2");
		
		
		this._positioner = this.appendElementNS("g", this._map, {transform: "translate("+(this._map_view_width/2)+","+(this._map_view_height/2)+")"});
		
		this.chart = this.appendElementNS("g", this._positioner, {width: this._worldmap_width, height: this._worldmap_height, transform: "translate(-90,-90) scale("+this._minimap_zoom_percent+")"});
		
		
		//back
		var back = this.appendElementNS("image", this.chart, {width: this._worldmap_width, height: this._worldmap_height});
		back.setAttributeNS(SVGNS_XLINK, "href", map_url);
		
		
		//charts: npc & positions
		this.chart_npc = this.appendElementNS("g", this.chart);
		this.chart_npc.style.display = Pref.show_npc ? "block" : "none"
		this.chart_positions = this.appendElementNS("g", this.chart);
		this.chart_positions.style.display = Pref.show_positions ? "block" : "none"
		
		
		//island
		var island_w = __bundles[Data.myTribe+"_zoom"][1].slice(0,-2),
			island_h = __bundles[Data.myTribe+"_zoom"][2].slice(0,-2);
		this.own_island = this.appendElementNS("image", this.chart, {width: island_w, height: island_h, transform:"translate(-"+(island_w/2)+" -20)"});
		this.own_island.style.display = Pref.show_own_island ? "block" : "none";
		this.own_island.setAttributeNS(SVGNS_XLINK, "href", __release+"gfx/buildings_romans/island_building_1.png");
		
		//dest
		var dest_w = __bundles.dest_icon[1].slice(0,-2),
			dest_h = __bundles.dest_icon[2].slice(0,-2);
		this.dest_icon = this.appendElementNS("image", this.chart, {width: dest_w, height: dest_h, transform:"translate(-"+(dest_w/2)+" -20)"}, "display:none");
		this.dest_icon.style.display = Pref.show_dest_icon ? "block" : "none";
		this.dest_icon.setAttributeNS(SVGNS_XLINK, "href", __release+"gfx/ui/seaview_target_1.png");
		
		
		//charts: islands
		this.chart_islands = this.appendElementNS("g", this.chart);
		
		this._viewpoint = this.appendElementNS("rect", this.chart, {x:10, y:10, strokeWidth:1, stroke:"#00f", fill: "transparent"});
		this.calcViewpoint();
		window.addEventListener("resize", function() {Minimap.calcViewpoint.apply(Minimap);});
		
		
		
		
		this._minimap_clicker = appendElement("div", minimap_main, false, "position:absolute; width:"+this._map_view_width+"px; height:"+this._map_view_height+"px; margin:5px; padding:1px;");
		
		
		EventBox.addListener(this._minimap_clicker, "wheel");
		EventBox.bind(this._minimap_clicker, "wheel", function(e) {
				var y = this._minimap_zoom_percent - (e.deltaY/Math.abs(e.deltaY))*0.05;
				this.zoom_map(y);
				
				Dnd.move_el(this._minimap_slider_arrow, 0, 50-this._minimap_zoom_percent*25); //:25 = 50*0.5
			}, false, this);
		
		Dnd.make_dragable(this._minimap_clicker, 
			function() {//boundaries
					return [this._minimap_pos_minX, this._minimap_pos_maxX, this._minimap_pos_minY, this._minimap_pos_maxY, this._mapX, this._mapY];
				}, 
			function(x,y) {//move
					this.chart.setAttributeNS(null, "transform", "translate("+(this._mapX=Math.round(x))+","+(this._mapY=Math.round(y))+") scale("+this._minimap_zoom_percent+")");
				}, this, false,
			function(e) {//end
				Ship_data.update(Ship_data.WORLDMAP);
			},
			function(e) {//click
					if(e.button == 1) {
						Dnd.move_el(this._minimap_slider_arrow, 0, 25); //:25 = 50*0.5
						this.zoom_map(1);
					}
					else {
						var pos = this._map_to_world_pos(e.pageX, e.pageY);
						this.jump_worldTo(pos[0], pos[1]);
					}
				},
				function(e) {//dblclick
					//var props = this._minimap_clicker.getBoundingClientRect();
					//this.jump_worldTo(e.pageX - props.left, e.pageY - props.top);
					var pos = this._map_to_world_pos(e.pageX, e.pageY);
					this.jump_worldTo(pos[0], pos[1]);
					this.toggle_expand();
				}
			//this.toggle_expand//dblclick
			);
		
		
		//Zusatzbuttons
		var button_div = appendElement("div", this._minimap_clicker, false, "position:absolute; right:20px; top:-20px; vertical-align:middle;");
		
		this._jumpToDest_button = appendElement("img", button_div, {className:"GM_clickable", src:__release+"gfx/icons/move_island_icon_small_0.png", title:__locale.jumpToDest}, "display:none; width:30px;");
		EventBox.bind(this._jumpToDest_button,
				"mouseup", function(e) {
					if(!this.hasCourse)
						return false;
					
					if(e.button == 0)
						window.location.hash="seamap("+this.calc_world_pos(this.destX, this.destY).join(",")+")";
					else
						this.scroll_mapTo([this.destX, this.destY]);
				
					return true;
			}, false, this);
			
		EventBox.bind(appendElement("img", button_div, {className:"GM_clickable", src:__release+"gfx/icons/home_icon_small_0.png", title:__locale.jumpToPlayer}, "display:inline-block; width:30px;"),
				"mouseup", function(e) {
					if(e.button == 0)
						this.jump_worldTo(Data.myX, Data.myY);
					else
						this.scroll_mapTo(this.calc_map_pos(Data.myX, Data.myY));
					return true;
			}, false, this);
		
		EventBox.bind(appendElement("img", button_div, {className:"GM_clickable", src:__release+"gfx/icons/inspect_icon_1.png", title:__locale.jumpToView}, "display:inline-block; width:30px;"),
				"mouseup", function() {
					this.scroll_mapTo(this.calc_map_pos(this.worldX, this.worldY));
				
					return true;
			}, false, this);
		
		
		
		var label = appendElement("label", this._minimap_clicker, {className:"GM_clickable"}, "position:absolute; left:0; bottom:0; color:black;");
		EventBox.bind(label, "mouseup", function() {
				Pref.scroll_with_seamap = !this.firstChild.checked;
				return true;
			}, false, label);
		EventBox.cloneEvents([
				appendElement("input", label, {type:"checkbox", checked:Pref.scroll_with_seamap}),
				appendElement("span", label, {textContent:"autoscroll"}, "font-size:x-small; vertical-align:4px;")],
				["mouseup"], label);
		
		
		
		
		//
		//slider
		//
		this._minimap_slider = appendElement("div", this._minimap_clicker, false, "position:absolute; right:0; bottom:0; width:15px; height:50px; padding:3px 0; background-color: #4C3611; border: 1px outset #46300D; border-radius: 5px 5px 5px 5px; cursor: n-resize;");
		var line = appendElement("div", this._minimap_slider, false, "height:50px; background-color:white; width: 1px; margin-left: 9px;");
		this._minimap_slider_arrow = createBundle("slider_arrow", this._minimap_slider, false, "position: absolute; left: 2px; top:"+(50-this._minimap_zoom_percent*25)+"px;");
		
		
		Dnd.make_dragable(this._minimap_slider_arrow,
			function() {return [0,0,0,50];}, 
			function(x,y) {
					this._minimap_slider_arrow.style.top = y + "px";
					this.zoom_map((50-y)*0.04);
				
				}, this, [0, 50-this._minimap_zoom_percent*25], false, 
			function(e) {
					if(e.button == 1) {
						Dnd.move_el(this._minimap_slider_arrow, 0, 25); //:25 = 50*0.5
						this.zoom_map(1);
					}
				}, 
			function() {
					Dnd.move_el(this._minimap_slider_arrow, 0, 25); //:25 = 50*0.5
					this.zoom_map(1);
				});
		
		EventBox.cloneEvents([line, this._minimap_slider], ["mousedown"], this._minimap_slider_arrow);
	
		EventBox.cloneEvents([this._minimap_slider, this._minimap_slider_arrow, line], ["wheel"], this._minimap_clicker);
		
		
		
		
		//
		//Expand
		//
		this._expand_button = createBundle("expand", this._minimap_clicker, {className:"GM_clickable GM_expand_button", title: "Karte vergrößern / verkleinern"});
		EventBox.bind(this._expand_button, "mouseup", this.toggle_expand, false, this);
		
		
		//
		//Lists
		//
		this._fav_main_div = appendElement("div", minimap_main, {className:"GM_list GM_fav"});
		
		//main
		var fav_toggle = appendElement("div", this._fav_main_div, {className:"GM_clickable"}, "position:absolute; right:3px; margin-top:-15px;"),
			fav_toggle_mini = createBundle("arrow_left", Pref.list_enabled ? fav_toggle : false, {title: "Listen ausblenden"}),
			fav_toggle_maxi = createBundle("arrow_right", Pref.list_enabled ? false : fav_toggle, {title: "Listen einblenden"}),
		
			fav_main = appendElement("div", this._fav_main_div, false, "width:155px; height:180px; margin:5px; overflow: hidden; background-color: #4C3611; border: 1px inset #46300D; border-radius: 10px; font-size: x-small; display:"+(Pref.list_enabled ? "block;" : "none;"));
		
		EventBox.bind(fav_toggle, "mouseup", function(main, toggle, mini, maxi) {
			if(Pref.list_enabled) {
				main.style.display = "none";
				toggle.removeChild(mini);
				toggle.appendChild(maxi);
			}
			else {
				main.style.display = "block";
				toggle.removeChild(maxi);
				toggle.appendChild(mini);
			}
			
			Pref.save_bool("list_enabled", Pref.list_enabled = !Pref.list_enabled);
			return true;
		}, [fav_main, fav_toggle, fav_toggle_mini, fav_toggle_maxi], this);
		
		EventBox.cloneEvents([fav_toggle_mini, fav_toggle_maxi], ["mouseup"], fav_toggle);
		
		
		//filter-menu
		var	filter_menu = appendElement("div", fav_main, {className:"GM_filter_menu"}, "width:100%; height:17px; padding: 0 3px; background-color:#807048;"),
			display_listItem = appendElement("div", filter_menu, {className: "GM_list_item GM_clickable", textContent: __locale.display}, "border-radius:0 0 0 5px"),
			islandTypes_listItem = appendElement("div", filter_menu, {className: "GM_list_item GM_clickable", textContent: __locale.islandTypes}, "border-radius:0 0 5px 0");
		
		display_listItem.type = 0;
		islandTypes_listItem.type = 1;
		
		this._active_filterList = display_listItem;
		EventBox.bind(display_listItem, "mouseup", this.switch_filterList, [display_listItem], this);
		EventBox.bind(islandTypes_listItem, "mouseup", this.switch_filterList, [islandTypes_listItem], this);
		
		
		//fav-menu
		var	fav_menu = appendElement("div", fav_main, {className:"GM_fav_menu"}, "width:100%; height:17px; padding: 0 3px; background-color:#807048;");
		
		this._positions_listItem = appendElement("div", fav_menu, {className: "GM_list_item GM_selected GM_clickable", textContent: __locale.positions}, "border-radius:0 0 0 5px");
		this._marks_guild_listItem = appendElement("div", fav_menu, {className: "GM_list_item GM_clickable", textContent: __locale.guilds});
		this._marks_player_listItem = appendElement("div", fav_menu, {className: "GM_list_item GM_clickable", textContent: __locale.player}, "border-radius:0 0 5px 0");
		EventBox.bind(this._positions_listItem, "mousedown", this.switch_favList, ["positions",], this);
		EventBox.bind(this._marks_guild_listItem, "mousedown", this.switch_favList, ["marks_guild"], this);
		EventBox.bind(this._marks_player_listItem, "mousedown", this.switch_favList, ["marks_player"], this);
		
		
		//content
		var line = appendElement("div", fav_main, false, "width: 100%; height: 16px; background-image:url('"+__release+"	gfx/posBookmarks/row_bg.png'); border-top:1px solid #807048;");
		EventBox.bind(
				createBundle("add", line, {className:"GM_clickable GM_plus_button"}, "float:right; margin:2px;"),
				"mousedown", function() {this.add_listItem();}, false, this);//function -> to loose the mouse-event-var
		this._list = appendElement("table", appendElement("div", fav_main, false, "width:100%; height:145px; overflow:auto;"), false, "width: 100%;");
		
		
		//switch
		EventBox.bind(
				appendElement("img", line, {className:"GM_clickable GM_switcher", src:__release+"gfx/icons/logbook_system_message_icon_small_0.png", title:__locale.toggle_worldmap_options}, " height:12px; margin:3px 0 0 2px; border:1px outset #46300D; display:block"),
				"mouseup", this.toggle_list, false, this);
		
		
		//
		//Ship data
		//
		Ship_data.create(minimap_main);
		
		
		//
		//insert
		//
		
		minimap_main.appendChild(this._map);
		
		this._searchoBox = getEl("./div[@class='smallBoxWrapper navigationMenu']", gid("seamap")).snapshotItem(0);
		this._searchField = getEl(".//input[@class='navigationInput']", this._searchoBox).snapshotItem(0);
		
		var div = this._searchField.parentNode;
		this._searchField.parentNode.parentNode.insertBefore(this._minimap_div, div);
		
		
		EventBox.addListener(minimap_main, "mousedown");
		
		Ringmenu.update_world_pos();
		this.jump_mapTo(this.worldX, this.worldY);
		
		EventBox.createPackage("list");
		this.switch_favList("positions");
		
		
		//positions
		for(var i=0, max=Pref.positions.length; i<max; ++i) {
			this.add_position(i);
		}
		
		//
		//Corrections
		//
		
		//this._searchField.style.marginRight = 0;
		this._searchField.style.margin = "0 0 5px 5px";
		this._searchField.className = "GM_searchfield";
		
		this._searchButton = this._searchField.nextSibling;
		this._searchButton.style.display = "inline-block";
		this._searchButton.style.position = "relative";
		this._searchButton.style.margin = 0;
		
		gid("seaMapOptionMenu").style.zIndex = 9998;
		//if(window.innerWidth > 1000)
			//gid("game").firstChild.style.zIndex = 10000;
		
		
		this._searchoBox.style.left = "5px";
		this._searchoBox.style.bottom = "10px";
		this._searchoBox.style.zIndex = 3000;
		
		
		//move travel-infos
		var nextTR = this._searchField.parentNode.parentNode.parentNode.nextSibling,
			moving_table = nextTR.firstChild.firstChild,
			first_td = moving_table.childNodes[1].firstChild.firstChild,
			second_td = first_td.nextSibling,
			stopButton = moving_table.getElementsByTagName("button")[0];
		
		this.travelTime_el = stopButton.parentNode.previousSibling;
		
		EventBox.bind(stopButton, "mouseup", this.stopCourse, false, this);
		stopButton.style.cssText = "height:20px; width:35px; font-size:x-small; background-image:url('"+__release+"gfx/icons/guildboard_delete_post.png'); background-color:initial; border-width:0";
		stopButton.style.width = "20px";
		stopButton.style.cursor = "pointer";
		stopButton.innerHTML = "";
		
		
		first_td.style.verticalAlign = "top";
		second_td.style.verticalAlign = "top";
		second_td.nextSibling.style.verticalAlign = "top";
		
		
		first_td.firstChild.style.display = "none";
		var statusPanel = getEl("./table[@class='statusPanel']", gid("game")).snapshotItem(0).firstChild,
			move_tr = appendElement("tr"),
			booster_tr = appendElement("tr", moving_table);
		
		
		appendElement("td", move_tr).appendChild(moving_table);
		
		EventBox.cloneEvents(
				[appendElement("img", first_td, {src:__release+"gfx/icons/move_island_icon_small_0.png", className:"GM_clickable"}, "width:25px; height:29.375px; margin:-1px -1px -10px -1px;")],
				["mouseup"], this._jumpToDest_button);
		moving_table.style.fontSize = "large";
		moving_table.style.fontWeight = "bold";
		moving_table.style.borderCollapse = "collapse";
		
		//create booster-space
		appendElement("td", booster_tr);
		this.booster_line = appendElement("td", booster_tr, false, "padding:0; font-size:small;");
		EventBox.bind(
				appendElement("img", this.booster_line, {src:__release+"gfx/icons/island_speed_icon_1.png"}, "width:20px; height:23.5px; vertical-align:top; padding-right:2px; cursor:pointer"),
				"mouseup", function() {
					do_action(gid("menu_item_accelerateIsland"), "click", true, 0, 0);
			});
		
		
		//replace world-button
		var world_button = createBundle("world_button", false, {className:"buttonMenuItem"}, "display:inline-block;");
		EventBox.bind(world_button, "mouseup", function() {
				if(!Pref.minimap_enabled)
					this.toggle_hide();
				if(!Pref.minimap_expanded)
					this.toggle_expand();
					
			}, false, this);
		gid("menu_item_worldMap").parentNode.insertBefore(world_button, gid("menu_item_worldMap"));
		gid("menu_item_worldMap").style.display = "none";
		
		History.init(this._minimap_clicker);
		
		statusPanel.insertBefore(move_tr, statusPanel.firstChild);
	},
	
	appendElementNS: function(eT, eP, attr) {
		var e=document.createElementNS("http://www.w3.org/2000/svg", eT), i;
		if(attr)
			for(i in attr)
				e.setAttributeNS(null, i, attr[i]);
		if(eP)
			eP.appendChild(e);
		return e;
	},

	_set_pattern: function(id) {
		var bundle = __bundles[id],
			pos = bundle[3].split(" "),
			path = this.appendElementNS("pattern", this._svgDefs, {id:id, width:bundle[1].slice(0,-2), height:bundle[2].slice(0,-2)}),
			
			img = this.appendElementNS("image", path, {
					x: pos[0].slice(0,-2),
					y: pos[1].slice(0,-2),
					width: bundle[4],
					height: bundle[5]
				});
		
			img.setAttributeNS(SVGNS_XLINK, "href", bundle[0].slice(5, -2));
	},
	
	calcViewpoint: function() {
		this._viewpoint.setAttributeNS(null, "width", this._viewPoint_width = Math.round(window.innerWidth * this._worldmap_stepX*(this.world_isZoomed ? 2 : 1)));
		this._viewpoint.setAttributeNS(null, "height", this._viewPoint_height = Math.round(window.innerHeight * this._worldmap_stepY*(this.world_isZoomed ? 2 : 1)));
	},
	toggle_viewpoint_zoom: function() {
		if(this.world_isZoomed = !Minimap.world_isZoomed) {
			this.worldX -= Math.round(window.innerWidth/2);
			this.worldY -= Math.round(window.innerHeight/2);
		}
		else {
			this.worldX += Math.round(window.innerWidth/2);
			this.worldY += Math.round(window.innerHeight/2);
		}
		var pos = this.calc_map_pos(this.worldX, this.worldY);
		this._viewpoint.setAttributeNS(null, "x", pos[0]);
		this._viewpoint.setAttributeNS(null, "y", pos[1]);
		this.calcViewpoint();
		
		return true;
	},
	
	calc_map_pos: function(x,y) {
		return [x*this._worldmap_stepX + this._worldmap_middleX, y*this._worldmap_stepY + this._worldmap_middleY];
	},
	calc_world_pos: function(x,y) {
		return [Math.round((x-this._worldmap_middleX)/this._worldmap_stepX), Math.round((y-this._worldmap_middleY)/this._worldmap_stepY)];
	},
	_map_to_world_pos: function(mouseX, mouseY) {
		var props = this._minimap_clicker.getBoundingClientRect(),
			posX = ((-this._mapX+this._minimap_pos_maxX) + (mouseX - props.left))/this._minimap_zoom_percent, 
			posY = ((-this._mapY+this._minimap_pos_maxY) + (mouseY - props.top))/this._minimap_zoom_percent;
		return this.calc_world_pos(posX, posY);
	},
	
	toggle_hide: function() {
		if(Pref.minimap_enabled)
			add_class(this._minimap_div, "hidden");
		else {
			remove_class(this._minimap_div, "hidden");
			this.refresh_islands();
		}
		Pref.save_bool("minimap_enabled", !Pref.minimap_enabled);
		return true;
	},
	toggle_expand: function() {
		if(Pref.minimap_expanded) {
			var width = this._map_view_width = Pref.minimap_width,
				height = this._map_view_height = Pref.minimap_height;
			
			remove_class(this._minimap_div, "expanded");
			this._searchoBox.style.zIndex = 3000;
		}
		else {
			var width = this._map_view_width = window.innerWidth - 35,
				height = this._map_view_height = window.innerHeight-90;
			
			add_class(this._minimap_div, "expanded");
			this._searchoBox.style.zIndex = 9999;
			
			if(Sidebar.opened)
				Sidebar.close();
		}
			
		this._minimap_clicker.style.width = width+"px";
		this._minimap_clicker.style.height = height+"px";
		this._map.setAttributeNS(null, "width", width);
		this._map.setAttributeNS(null, "height", height);
		
		this._minimap_pos_maxX = -width/2;
		this._minimap_pos_maxY = -height/2;
		this._minimap_pos_minX = -(this._worldmap_width*this._minimap_zoom_percent)+width/2;
		this._minimap_pos_minY = -(this._worldmap_height*this._minimap_zoom_percent)+height/2;
		
		this._positioner.setAttributeNS(null, "transform", "translate("+(width/2)+","+(height/2)+")");

		this.chart.setAttributeNS(null, "transform", "translate("
			+(this._mapX = checkBoundaries(this._mapX, this._minimap_pos_minX, this._minimap_pos_maxX))+","
			+(this._mapY = checkBoundaries(this._mapY, this._minimap_pos_minY, this._minimap_pos_maxY))+") scale("
			+this._minimap_zoom_percent+")");
		
		Pref.save_bool("minimap_expanded", !Pref.minimap_expanded);
		return true;
	},
	scroll_mapTo: function(pos) {
		this.chart.setAttributeNS(null, "transform", "translate("
				+(this._mapX = checkBoundaries(-pos[0]*this._minimap_zoom_percent, this._minimap_pos_minX, this._minimap_pos_maxX))+","
				+(this._mapY = checkBoundaries(-pos[1]*this._minimap_zoom_percent, this._minimap_pos_minY, this._minimap_pos_maxY))
				+") scale("+this._minimap_zoom_percent+")");
	},
	jump_mapTo: function(x, y) { //expects top-left position of viewpoint
		this.worldX = x;
		this.worldY = y;
		
		var pos = this.calc_map_pos(x,y);
			x_view = pos[0]*this._minimap_zoom_percent + this._mapX,
			y_view = pos[1]*this._minimap_zoom_percent + this._mapY;
		
		this._viewpoint.setAttributeNS(null, "x", pos[0]);
		this._viewpoint.setAttributeNS(null, "y", pos[1]);
		
		if(Pref.scroll_with_seamap &&(x_view < this._minimap_pos_maxX || y_view < this._minimap_pos_maxY
				|| x_view > this._map_view_width+this._minimap_pos_maxX - this._viewPoint_width*this._minimap_zoom_percent
				|| y_view > this._map_view_height+this._minimap_pos_maxY - this._viewPoint_height*this._minimap_zoom_percent)) {
			pos[0] += this._viewPoint_width/2;
			pos[1] += this._viewPoint_height/2;
			this.scroll_mapTo(pos);
		}
	},
	jump_worldTo: function(x, y) {
		window.location.hash="seamap("+x+","+y+")";
	},
	jump_toPlayer: function(user) {
		var temp = this._searchField.value;
		this._searchField.value = user;
		do_action(this._searchButton, "click");
		this._searchField.value = temp;
	},
	zoom_map: function(percent) {
		var last_zoom = this._minimap_zoom_percent;
		
		this._minimap_zoom_percent = checkBoundaries(percent, 0.1, 2);
		
		this._minimap_pos_minX = -(this._worldmap_width*this._minimap_zoom_percent)+this._map_view_width/2;
		this._minimap_pos_minY = -(this._worldmap_height*this._minimap_zoom_percent)+this._map_view_height/2;
		this.chart.setAttributeNS(null, "transform", "translate("
				+(this._mapX = checkBoundaries((this._mapX/last_zoom) * this._minimap_zoom_percent, this._minimap_pos_minX, this._minimap_pos_maxX))+","
				+(this._mapY = checkBoundaries((this._mapY/last_zoom) * this._minimap_zoom_percent, this._minimap_pos_minY, this._minimap_pos_maxY))+") scale("
				+this._minimap_zoom_percent+")");
		
		Pref.save("minimap_zoom", this._minimap_zoom_percent, true);
	},
	
	
	get_island_color: function(isl) {
		if(Pref.marks_player.hasOwnProperty(isl.user))
			return Pref.marks_player[isl.user];
		else if(Pref.marks_guild.hasOwnProperty(isl.guild))
			return Pref.marks_guild[isl.guild];
		
		switch(isl.dipl) {
			case FRIEND:
				return "green";
			case ALLY:
				return "royalblue";
			case ENEMY:
				return "red";
		}
		return "black";
	},
	get_island_stroke: function(isl) {
		if(isl.boost)
			return "red";
		else
			return "white";
	},
	
	add_npc: function(isl) {
		if(isl.is_on_wm)
			return;
		
		isl.el_wm = this.appendElementNS("circle", this.chart_npc, {
				r: 20,
				fill: "url(#npc_map"+isl.nation+")"
			});
		
		isl.is_on_wm = true;
	},
	update_npc: function(isl) {
		var pos = this.calc_map_pos(isl.x, isl.y);
		
		isl.el_wm.setAttributeNS(null, "cx", pos[0]);
		isl.el_wm.setAttributeNS(null, "cy", pos[1]);
	},
	remove_npc: function(isl) {
		if(!isl.is_on_wm)
			return;
		
		//if(isl.dir_el)
			//this.chart_npc.removeChild(isl.dir_el);
		//else
			this.chart_npc.removeChild(isl.el_wm);
		
		isl.is_on_wm = false;
	},
	
	add_island: function(isl) {
		var p = Pref;
		if(isl.is_on_wm || !p.minimap_enabled)	
			return;
		
		isl.el_wm = this.appendElementNS("g", this.chart_islands);
		if(p.show_island_names) {
			var icon_size = p.icon_size,
				rect = this.appendElementNS("rect", isl.el_wm, {
					x: 0,
					opacity: 0.7
				}),
				t_element = this.appendElementNS("text", isl.el_wm, {
					x: icon_size-icon_size+3,
					fill: "white",
					"stroke-width": 0,
					"font-size": 10,
					"font-weight": "bold"
				}),
				text = document.createTextNode(isl.user);
			t_element.appendChild(text);
			
			var bbox = t_element.getBBox();
			rect.setAttributeNS(null, "width", bbox.width+6);
			rect.setAttributeNS(null, "height", bbox.height+6);
			rect.setAttributeNS(null, "y", Math.round(-bbox.height-icon_size-1));
			t_element.setAttributeNS(null, "y", -icon_size);
		}
		isl.el_circle = this.appendElementNS("circle", isl.el_wm, {
				r: p.icon_size,
				opacity:0.8,
				"stroke-width":1
			});
		
		isl.is_on_wm = true;
	},
	update_island: function(isl) {
		var p = Pref;
		
		if(!isl.is_on_wm || !(
				(p.show_standing && !isl.dir && !isl.boost)
				|| (p.show_moving && (isl.dir || isl.boost))
				|| (p.show_friends && isl.dipl == FRIEND)
				|| (p.show_allys && isl.dipl == ALLY)
				|| (p.show_enemys && isl.dipl == ENEMY)
				|| (p.show_attacking && isl.attack)
				|| (p.show_highlevels && isl.highlevel)
				|| (p.show_lowlevels && isl.lowlevel)
				|| (p.show_mark_player && p.marks_player.hasOwnProperty(isl.user))
				|| (p.show_mark_guild && p.marks_guild.hasOwnProperty(isl.guild))
			))
			return;
		
		var pos = this.calc_map_pos(isl.x, isl.y),
			color = this.get_island_color(isl),
			stroke = this.get_island_stroke(isl);
		
		
		isl.el_wm.setAttributeNS(null, "transform", "translate("+Math.round(pos[0])+","+Math.round(pos[1])+")");
		isl.el_wm.setAttributeNS(null, "fill", color);
		isl.el_wm.setAttributeNS(null, "stroke", stroke);
		
		if(isl.highlevel || isl.lowlevel) {
			if(!isl.level_el) {
				isl.level_el = this.appendElementNS("rect", isl.el_wm, {
						opacity:0.8,
						x: -p.icon_size-1,
						y: -p.icon_size-1,
						width: p.icon_size*2+2,
						height: p.icon_size*2+2,
						stroke: isl.highlevel ? "red" : "green",
						fill:"none",
						"stroke-width":1
					});
			}
		}
		else if(isl.level_el) {
			isl.el_wm.removeChild(isl.level_el);
			isl.level_el = false;
		}
		
		if(isl.dir) {
			if(!isl.dir_el) {
				var s = p.icon_size,
					s2 = s/2;
				isl.dir_el = this.appendElementNS("polygon", isl.el_wm, {
						opacity:0.8,
						"stroke-width":1,
						transform: "rotate("+isl.dir+")",
						points:"0,"+s+" -"+s2+","+s2+" -"+s2+",-"+s2+" 0,-"+s+" "+(s*2)+",0"
					});
				isl.dir_el_degree = isl.dir;
				isl.el_wm.removeChild(isl.el_circle);
			}
			else if(isl.dir != isl.dir_el_degree)
				isl.dir_el.setAttributeNS(null, "transform", "rotate("+isl.dir+")");
		}
		else if(isl.dir_el) {
			isl.el_wm.removeChild(isl.dir_el);
			isl.dir_el = false;
			isl.el_wm.appendChild(isl.el_circle);
		}
		
		if(isl.attack) {
			if(!isl.attack_el) {
				isl.attack_el = this.appendElementNS("image", isl.el_wm, {
						width:8.75,
						height:12.5,
						opacity:0.7
					});
				isl.attack_el.setAttributeNS(SVGNS_XLINK, "href", __release+"gfx/icons/skull_red_seaview_icon.png");
			}
		}
		else if(isl.attack_el) {
			isl.el_wm.removeChild(isl.attack_el);
			isl.attack_el = false;
		}
	},
	remove_island: function(isl) {
		if(!isl.is_on_wm)
			return;
		
		this.chart_islands.removeChild(isl.el_wm);
		isl.level_el = false;
		isl.dir_el = false;
		isl.attack_el = false;
		isl.is_on_wm = false;
	},
	refresh_islands: function() {
		var isls = Data.islands;
		for(var i in isls) {
			this.remove_island(isls[i]);
			this.add_island(isls[i]);
			this.update_island(isls[i]);
		}
	},
	
	add_position: function(i) {
		var p = Pref,
			pos = p.positions[i].split(","),
			npos = this.calc_map_pos(pos[0], pos[1]),
			g = this.appendElementNS("g", this.chart_positions, {
					transform:"translate("+Math.round(npos[0])+","+Math.round(npos[1])+")"
				});
			
			this.appendElementNS("circle", g, {
					r:30,
					fill:"white",
					opacity:0.3
				});
			var t_element = this.appendElementNS("text", g, {
				fill: "black",
				"stroke-width": 0,
				"font-size": 14,
				"font-weight": "bold",
				"background-color":"white",
				opacity:0.8,
				transform:"skewY(-20)"
			}),
			text = document.createTextNode(p.position_keys[i]),
			image = this.appendElementNS("image", g, {
					x:-13,
					y:-17,
					width:24,
					height:24,
				});
		t_element.appendChild(text);
		
		//var bbox = t_element.getBBox();			
		//t_element.setAttributeNS(null, "x", Math.round(-bbox.width/2));
		//t_element.setAttributeNS(null, "y", Math.round(bbox.height/2));

		//TODO: getComputedTextLength gives 0 (getBBox an error) when parentNode is display:none
		t_element.setAttributeNS(null, "x", Math.round(-t_element.getComputedTextLength()/2));
		t_element.setAttributeNS(null, "y", 10);
		
		image.setAttributeNS(SVGNS_XLINK, "href", __release+"gfx/ui/guildboard_thread_sticky_icon.png");
	},
	
	add_listCheckbox: function(title, fu, checked, img) {
		var label = appendElement("label", this._list, {className:"GM_clickable"}, "display:block"),
			space = appendElement("div", label, false, "width:12px; height:12px; display:inline-block;background-size:12px 12px;"+(img ? "background-image:url('"+img+"');" : ""));
			checkbox = appendElement("input", label, {type: "checkbox", checked:checked});
		EventBox.bind_p("list", label, "mouseup", fu, [checkbox], this);
		EventBox.cloneEvents_p("list", 
				[checkbox, appendElement("span", label, {textContent: title})],
				["mouseup"], label);
	},
	toggle_list: function() {
		if(this._fav_main_div.className != "GM_list GM_filter") {
			this._fav_main_div.className = "GM_list GM_filter";
			EventBox.emptyPackage("list");
			this._list.innerHTML = "";
			this.switch_filterList(this._active_filterList);
		}
		else {
			this._fav_main_div.className = "GM_list GM_fav";
			EventBox.emptyPackage("list");
			this._list.innerHTML = "";
			this.switch_favList(this._active_favList);
		}
		return true;
	},
	switch_filterList: function(listItem) {
		this._active_filterList.className = "GM_list_item GM_clickable";
		listItem.className = "GM_list_item GM_clickable GM_selected";
		this._active_filterList = listItem;
		EventBox.emptyPackage("list");
		this._list.innerHTML = "";
		var list = this._list;
		
		if(listItem.type == 0) {
			this.add_listCheckbox(__locale.island_names, function(checkbox) {
					Pref.save_bool("show_island_names", !checkbox.checked); //checked-change happens after event
					this.refresh_islands();
				}, Pref.show_island_names, false);
			
			this.add_listCheckbox(__locale.npcs, function(checkbox) {
					Pref.save_bool("show_npc", !checkbox.checked);
					this.chart_npc.style.display = Pref.show_npc ? "block" : "none";
				}, Pref.show_npc, false);
				
			this.add_listCheckbox(__locale.own_island, function(checkbox) {
					Pref.save_bool("show_own_island", !checkbox.checked);
					this.own_island.style.display = Pref.show_own_island ? "block" : "none";
				}, Pref.show_own_island, false);
				
			this.add_listCheckbox(__locale.destination, function(checkbox) {
					Pref.save_bool("show_destination", !checkbox.checked);
					this.dest_icon.style.display = (Pref.show_destination && this.hasCourse) ? "block" : "none";
				}, Pref.show_destination, false);
			
			this.add_listCheckbox(__locale.positions, function(checkbox) {
					Pref.save_bool("show_positions", !checkbox.checked);
					this.chart_positions.style.display = (Pref.show_positions) ? "block" : "none";
				}, Pref.show_positions, false);
		}
		
		else if(listItem.type == 1) {
			this.add_listCheckbox(__locale.marked_player, function(checkbox) {
					Pref.save_bool("show_mark_player", !checkbox.checked);
					this.refresh_islands();
				}, Pref.show_mark_player, __release+"gfx/icons/logbook_tile_icon_small_0.png");
			
			this.add_listCheckbox(__locale.marked_guilds, function(checkbox) {
					Pref.save_bool("show_mark_guild", !checkbox.checked);
					this.refresh_islands();
				}, Pref.show_mark_guild, __release+"gfx/icons/logbook_guild_icon_small_0.png");
			
			this.add_listCheckbox(__locale.standing_island, function(checkbox) {
					Pref.save_bool("show_standing", !checkbox.checked);
					this.refresh_islands();
				}, Pref.show_standing, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QcOEzQaaKMZ1gAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAABWSURBVCjPpVFBDoAwCGv9eDnw73owxombma4J4UCBUoBV2JYvqNZZyAaAiECbSbI32ZlpALeQjoVdGZV8xkOebUsaNrRbtiVnpiW9yapH/7d19nGfsQMdWYqKNQZcigAAAABJRU5ErkJggg==");
			
			this.add_listCheckbox(__locale.moving_island, function(checkbox) {
					Pref.save_bool("show_moving", !checkbox.checked);
					this.refresh_islands();
				}, Pref.show_moving, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABmJLR0QAAQBwAAnpDkI7AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QcOEzYslS/uzQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAABHSURBVCjPrZFBCsAwDMPksX/76dphFHprKRXkEgTBDtzGn+6KtlV1SwScV0txnnHlHXKSrUwPQJKoqLQ9amWd4bil4z9c4wMIsHKQ0Ae0qQAAAABJRU5ErkJggg==");
			
			this.add_listCheckbox(__locale.attacking, function(checkbox) {
					Pref.save_bool("show_attacking", !checkbox.checked);
					this.refresh_islands();
				}, Pref.show_attacking, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QcREjcki1d6QAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAHiSURBVCjPVdDPb9JgHAbw533bkWFlMEQEtmXrMB4EYobOXbaYwM39AR68m5js6HH/gVcPxpCYiHHZ2YvxYOKWxcwFWIIhjaNglNV1QF0p9he2rxcx4Xt+PnmefAn+3dP19Zv3NjYeL2Wz9y87TvSPoniddrtZk6SXLw4Odj8CFwDAAUAYiGxvbW3nC4VHl0QxSmw7yPF8cDYQmA+cnWVnXVd+q+sNAKAAUFpdvb6cShUxNUW9Wg3+yQmYqhK/20XScVI3bDszXkIBwM3l5kPxeJT1eoR1uwSjEXxZBmu3EQgG+fDc3LUx4AHAsyzOaDTom/19mK0WHqyt4WulgveyjEI4TK7yvDAByNGRYfH8SD8+ZqGFBSIdHuJHrwfb92FSyjxB8CdA3LJ0PhbTn2xuXrkQRfaqXCZ3Ewk8zOcZYYxVdF0fAw4AXhuGnlaUtGcYeTGToemZGSxyHAaCgGa12t1ptZ59dhzpfwOA4WmnU7U8z5RKpVBuehrvDAPfTRPJ83PVdd36xJcAgEYi2p1YzBYSCdb0fRiqypKaxhzGVAoYE5MA4LdlsduELBaLxeVbKytcnlL2S9OUD8Phzh5jexrgTYCfQF8eDr8sOY46qte/nfb7nyqDwfOyae52AGuc+wvCv+IRYC4oEAAAAABJRU5ErkJggg==");
			
			this.add_listCheckbox(__locale.highlevel, function(checkbox) {
					Pref.save_bool("show_highlevels", !checkbox.checked);
					this.refresh_islands();
				}, Pref.show_highlevels, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QcOEy0a86OwzgAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAABkSURBVCjPnZHBDoAgDENbf3wc+O/nASe66AGaLCRLS1swElpBFQDBRFSukbDki4wktdb0PG37vjwdAHrvjP2ciGH4EmSMSs7JeE8BEfErSBckDq1iK1KW/opVS+8/69LHrXQ+AaK+sminv3l5AAAAAElFTkSuQmCC");
			
			this.add_listCheckbox(__locale.lowlevel, function(checkbox) {
					Pref.save_bool("show_lowlevels", !checkbox.checked);
					this.refresh_islands();
				}, Pref.show_lowlevels, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QcOEy0S/Xg4/AAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAABeSURBVCjPnZK5DcAwDAOldN7WG7Dx3pdK8RMHiExAHQ+iHvdasIxWABBdenlH4HFJSJ3bAgCtNcxsqgAnIGKs5qhoPAJI+gSii9fCZVkdRYqhd7G2Qx+t9e/hPPsaNwtGw84MkpTJAAAAAElFTkSuQmCC");
			
			this.add_listCheckbox(__locale.friends, function(checkbox) {
					Pref.save_bool("show_friends", !checkbox.checked);
					this.refresh_islands();
				}, Pref.show_friends, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QcOEzQxxB/glgAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAB+SURBVCjPpZGxDoJAEETfXKc/hp+jLTHcEijs/ByNH2bJWnAHAa8QnGSbncnsZBb+hbtHnxHXvFZiB7BnD4CdrqNIUsnZ+9fNdT4sJj46z0bThXTawuVYjDnc3wAmqQ1pZzlGCYkzgLC1lH2RJLUATVV/ifMua/bX+uvjNuMDqntXQksKIiYAAAAASUVORK5CYII=");
			
			this.add_listCheckbox(__locale.allys, function(checkbox) {
					Pref.save_bool("show_allys", !checkbox.checked);
					this.refresh_islands();
				}, Pref.show_allys, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QcOEzQ3LXxFowAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAACESURBVCjPpZHBDYMwDEWfEYOgLoQ6A90DOkalInUCEB0IscnvoXEIlEMj3tF+P3YSOIukVivtvm87WQDPcQbgdr18JbPolan8ei88hjke0E8LTV0hSR4qfA1gI6eh1ClCvfM1jgi9Lg38TZzgFzwi9NYJZnYHaOrqR/aaO9nPmv1x2XwAw41RO5ZbTGgAAAAASUVORK5CYII=");
			
			this.add_listCheckbox(__locale.enemys, function(checkbox) {
					Pref.save_bool("show_enemys", !checkbox.checked);
					this.refresh_islands();
				}, Pref.show_enemys, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QcOEzQrOX0Z7AAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAB3SURBVCjPpZFLEkAwEETfWChHlVPgDqqoclFs2kLGJyykvOV0d+YT+IukRidNqltiFsA8DABUIewmM3sEJGmZJpa+v71Y1jVVCEeo8DGAhxlgHUeuniLWWx/jjai118Bnjg6+4BtROzuYWecLpnjNPdlnzf64bDZENUvloYkHkgAAAABJRU5ErkJggg==");
		}
		return true;
	},
	switch_favList: function(type) {
		EventBox.emptyPackage("list");
		this["_"+this._active_favList+"_listItem"].className = "GM_list_item GM_clickable";
		this._active_favList = type;
		this["_"+type+"_listItem"].className = "GM_list_item GM_clickable GM_selected";
		
		var data = Pref[type],
			isPosition = (type == "positions"),
			data_names = isPosition ? Pref["position_keys"] : false,
			table = this._list,
			tr,
			clickFu, deleteFu;
		
		if(isPosition) {
			clickFu = function(pos, i, e) {
				if(e.button == 1) {
					var k = pos.split(",");
					this.scroll_mapTo(this.calc_map_pos(k[0], k[1]));
				}
				else {
					if(Pref.minimap_expanded)
						this.toggle_expand();
					window.location.hash="seamap("+pos+")";
					
				}
				
				return true;
			}
			deleteFu = function(type, i) {
				Pref.delete_inArray("positions", i);
				Pref.delete_inArray("position_keys", i);
				this.chart_positions.removeChild(this.chart_positions.childNodes[i]);
				this.switch_favList("positions");
			} 
		}
		else {
			if(type == "marks_player") {
				clickFu = function(color, name, e) {
					if(Data.islands.hasOwnProperty(name)) {
						var isl = Data.islands[name];
						if(e.button == 1)
							this.scroll_mapTo(this.calc_map_pos(isl.x, isl.y));
						else {
							if(Pref.minimap_expanded)
								this.toggle_expand();
							Minimap.jump_worldTo(isl.x, isl.y);
						}
					}
					else {
						this.jump_toPlayer(name);
					}
					return true;
				}
			}
			else {
				clickFu = function(color, name) {
						if(!Data.guilds.hasOwnProperty(name))
							return;
						
						Sidebar.open(Sidebar.CACHE);
						Sidebar.openGuild(name);
					};
			}
			
			deleteFu = this.delete_marker;
		}
		
		table.innerHTML = "";
		for(var i in data) {
			tr = appendElement("tr", table);
			EventBox.bind_p("list", appendElement("td", tr, {textContent:(isPosition ? data_names[i] : i), className:"GM_clickable"}, "color:"+((isPosition || data[i] == "transparent") ? "white" : data[i])), "mouseup", clickFu, [data[i], i], this)
			appendElement("td", tr);
			EventBox.bind_p("list", createBundle("del", appendElement("td", tr, false, "width:16px"), {className:"GM_clickable"}), "mouseup", deleteFu, [type, i], this);
		}
		
		return true;
	},
	add_listItem: function(type, data) {
		type = type || this._active_favList;
		switch(type) {
			case "positions":
				var pos_str = (this.worldX+Math.round(window.innerWidth/2))+','+Math.round(this.worldY+(window.innerHeight/2)),
					title;
				
				if(!(title=prompt(__locale.saving_position, pos_str)))
					return;
				
				Pref.save_array("positions", pos_str);
				Pref.save_array("position_keys", title);
				this.add_position(Pref.positions.length-1);
				this.switch_favList("positions");
			return;
			case "marks_player":
				var win = new Window(__locale.player_mark, 500, 300),
					label_text = __locale.player;
			break;
			case "marks_guild":
				var win = new Window(__locale.guild_mark, 500, 300),
					label_text = __locale.guild_short;
			break;
		}
		win.create_colorTable();
		var label = appendElement("label", win.content, {textContent: label_text+": "}),
			input = appendElement("input", label, {type:"text", value:(data || "")}, "width: 100px");
		win.bind(appendElement("input", win.content, {type:"button", value: __locale.add}, "display:block; margin-top:20px"), "mouseup",
				function(input, win, type) {
					var value = input.value;
					Pref.save_object(type, input.value, win.current_color);
					win.close();
					this.switch_favList(type);
					if(this._fav_main_div.className != "GM_list GM_fav")
						this.toggle_list();
					if(type == "marks_player") {
						if(Data.islands.hasOwnProperty(input.value)) {
							this.update_island(Data.islands[input.value]);
							
							var el = gid(Data.islands[input.value].id);
							if(el) {
								el = toChild(el,4);
								el.style.backgroundColor = win.current_color;
								el.className = "GM_island_marked";
							}
						}
					}
					else {
						if(!Data.guilds.hasOwnProperty(input.value))
							return;
						
						var g = Data.guilds[input.value],
							i = g.length;
						
						while(i--) {
							this.update_island(g[i]);
						}
						Data.loop_islands();//NOTE: active guild-islands will be checked two times 
					}
				}, [input, win, type], this);
		win.insert();
	},
	delete_marker: function(type, i) {
		Pref.delete_inObject(type, i);
		this.switch_favList(type);
		if(type == "marks_player") {
			if(Data.islands.hasOwnProperty(i)) {
				this.refresh_islands()//because when island wouldnt be shown anymore, update_island will cancel itself
				
				var el = gid(Data.islands[i].id);
				if(el) {
					el = toChild(el,4);
					el.style.backgroundColor = "transparent";
					el.className = "";
				}
			}
		}
		else {
			if(Data.guilds.hasOwnProperty(i)) {
				var g = Data.guilds[i],
					i = g.length;
				
				while(i--) {
					isl = g[i];
					this.update_island(g[i]);
					el = gid(isl.id);
					if(el) {
						el = toChild(el,3);
						el.lastChild.style.backgroundColor = "transparent";
						el.lastChild.className = "GM_island_marked";
					}
				}
			}
		}
		return true;
	},
	
	setCourse: function(x, y) {
		if(!x && !y) {//when x and y are 0, this would be false too - but what are the odds...
			var pos = Ringmenu.get_ringmenuPos(),
				npos = Minimap.calc_map_pos(pos[0] + Minimap.worldX, pos[1] + Minimap.worldY);
			x = npos[0];
			y = npos[1];
		}
		var dest_icon = this.dest_icon;
		if(Pref.show_destination)
			dest_icon.style.display = "block";
		dest_icon.setAttributeNS(null, "x", x);
		dest_icon.setAttributeNS(null, "y", y);
		
		this.destX = x;
		this.destY = y;
		
		if(this._stopCource_ID)
			window.clearInterval(this._stopCource_ID);
		this.stopCource_ID = window.setTimeout(function() {
				var time = Minimap.travelTime_el.firstChild.textContent.split(":");
				Minimap.stopCource_ID = window.setTimeout(Minimap.stopCourse, (parseInt(time[0])*60*60 + parseInt(time[1])*60 + parseInt(time[2]))*1000);
			}, 200);
		
		this._jumpToDest_button.style.display = "inline-block";
		this.hasCourse = true;
	},
	stopCourse: function() {//is also called by setTimeout!
		if(Minimap._stopCource_ID)
			window.clearInterval(Minimap._stopCource_ID);
		Minimap.dest_icon.style.display = "none";
		Minimap._jumpToDest_button.style.display = "none";
		Minimap.hasCourse = false;
	}
};

Ship_data = {
	WORLDMAP: 1,
	SEAMAP: 2,
	RINGMENU: 3,
	_current_state: null,
	_currentX:0,
	_currentX:0,
	
	create: function(parent) {
		this._currentX = Data.myX;
		this._currentY = Data.myY;
		
		this._main = appendElement("div", parent, false, "position:absolute; overflow:hidden; left:140px; right:5px; bottom:5px; height:20px; padding:2px; border:1px inset #46300D; border-radius:5px; background-color: #4C3611;");
		var ship_data = appendElement("img", this._main, {className:"GM_clickable", src:__release+"gfx/icons/research_icon_capacity_ships.png"}, "position:absolute; top:0; right:0; height:22px;");
		
		EventBox.bind(ship_data, "mouseup", this.show_shipData, false, this);
		this._state = appendElement("div", this._main, false, "display:inline-block; height:20px; background-color:#807048; margin:-2px 8px 0 -2px; padding:2px; border-right:1px solid black; border-radius:3px;");
		
		this._current_state = this._state_seamap = appendElement("img", this._state, {src:__release+"gfx/icons/seaview_tab_icon_1.png", title:__locale.seamap_position}, "height:24px;");
		
		this._state_worldmap = appendElement("img", false, {src:__release+"gfx/icons/world_map_icon_small_0.png", title:__locale.worldmap_position}, "height:24px;");
			EventBox.bind(this._state_worldmap, "mouseup", this.update, [this.SEAMAP], this);
		
		this._state_ringmenu = appendElement("div", false, {title:__locale.ringmenu_position});
			EventBox.bind(this._state_ringmenu, "mouseup", this.update, [this.WORLDMAP], this);
			EventBox.cloneEvents([
					appendElement("img", this._state_ringmenu, {src:__release+"gfx/ui/crosshair.png"}, "position:absolute; height:24px; margin:-2px;"),
					appendElement("img", this._state_ringmenu, {src:__release+"gfx/icons/seaview_tab_icon_1.png"}, "height:24px;"),
					this._state_seamap
				], ["mouseup"], this._state_ringmenu);
		
		
		this._explore = appendElement("div", this._main, {title:__locale.explore}, "display:inline-block; vertical-align:top;");
		appendElement("img", this._explore, {src:__release+"gfx/icons/explore_icon_1.png"}, "display:inline-block; width:17px; margin-right:2px;");
		appendElement("span", this._explore, {textContent:"0:00:00"}, "vertical-align:top; font-size:14px;");
		
		this.romans_scout_ship = appendElement("div", this._main, {title:this.ship_data["romans_scout_ship"][0]}, "display:inline-block; vertical-align:top;");
		appendElement("div", this.romans_scout_ship, false, "display:inline-block; width:30px; height:30px; margin:-5px -7px 0 0; background-image:url('"+__release+"gfx/ships_romans/scoutship_seaview_moving.png'); background-size:240px 30px;");
		appendElement("span", this.romans_scout_ship, {textContent:"0:00:00"}, "vertical-align:top; font-size:14px;");
		
		this.romans_island_breaker = appendElement("div", this._main, {title:this.ship_data["romans_island_breaker"][0]}, "display:inline-block; vertical-align:top; margin-left:10px;");
		appendElement("div", this.romans_island_breaker, false, "display:inline-block; width:20px; height:20px; background-image:url('"+__release+"gfx/ships_romans/islandbreaker_seaview_moving.png'); background-size:160px 20px;");
		appendElement("span", this.romans_island_breaker, {textContent:"0:00:00"}, "vertical-align:top; font-size:14px;");
		
		this.romans_transport_ship = appendElement("div", this._main, {title:this.ship_data["romans_transport_ship"][0]}, "display:inline-block; vertical-align:top; margin-left:5px;");
		appendElement("div", this.romans_transport_ship, false, "display:inline-block; width:30px; height:30px; margin:-5px -7px 0 0; background-image:url('"+__release+"gfx/ships_romans/transportship_seaview_moving.png'); background-size:240px 30px;");
		appendElement("span", this.romans_transport_ship, {textContent:"0:00:00"}, "vertical-align:top; font-size:14px;");
		
		this.romans_trade_ship = appendElement("div", this._main, {title:this.ship_data["romans_trade_ship"][0]}, "display:inline-block; vertical-align:top; margin-left:10px;");
		appendElement("div", this.romans_trade_ship, false, "display:inline-block; width:20px; height:20px; background-image:url('"+__release+"gfx/ships_romans/tradeship_seaview_moving.png'); background-size:160px 20px;");
		appendElement("span", this.romans_trade_ship, {textContent:"0:00:00"}, "vertical-align:top; font-size:14px;");
		
		
		appendElement("div", (this._seamap_marker = appendElement("div", gid("gvSeamap").firstChild.nextSibling, false, "position:absolute; left:50%; top:50%; margin-left:-5px; margin-top:-5px; width:11px; height:1px; background-color:black; z-index:1; display:none;")), false, "position:absolute; left:5px; top:-5px; width:1px; height:11px; background-color:inherit;");
		appendElement("div", (this._worldmap_marker = appendElement("div", Minimap._minimap_clicker, false, "position:absolute; left:50%; top:50%; margin-left:-5px; margin-top:-5px; width:11px; height:1px; background-color:blue; z-index:1; display:none;")), false, "position:absolute; left:5px; top:-5px; width:1px; height:11px; background-color:inherit;");
		
		
		
		
	},
	parseTime: function(sek) {
		var min = Math.floor(sek/60),
			hour = Math.floor(min/60);
		
		sek = Math.round(sek - min*60);
		min -= hour*60;
		
		if(sek<10)
			sek = "0"+sek;
		if(min<10)
			min="0"+min;
			
		return hour+":"+min+":"+sek;
	},
	exploreTime: function() {
		this._explore.lastChild.textContent = this.parseTime(Math.sqrt(Math.pow(this._currentX - Data.myX,2) + Math.pow(this._currentY - Data.myY,2))*2);
	},
	shipTime: function(i) {
		this[i].lastChild.textContent = this.parseTime(Math.sqrt(Math.pow(this._currentX - Data.myX,2) + Math.pow(this._currentY - Data.myY,2))/this.ship_data[i][1]);
	},
	show_shipData: function() {
		var win = new Window(__locale.troop_time, 500, 500), tr
			data = Data;
		
		var table_general = appendElement("table", win.content, {border:0}, "float:right; width:190px");
		appendElement("th", table_general, {textContent:__locale.general, colSpan:2});
			
		var table_romans = appendElement("table", win.content, {border:0}, "width:190px");
		tr = appendElement("th", table_romans, {textContent:__locale.romans, colSpan:2});
		createBundle("romans_zoom", tr, false, 'float:left');
			
		var table_npc = appendElement("table", win.content, {border:0}, "float:right; width:190px");
		tr = appendElement("th", table_npc, {textContent:__locale.npcs, colSpan:2});
		createBundle("villains_zoom", tr, false, "float:left");
		
		var table_vikings = appendElement("table", win.content, {border:0}, "width:190px");
		tr = appendElement("th", table_vikings, {textContent:__locale.vikings, colSpan:2});
		createBundle("vikings_zoom", tr, false, "float:left");
		
		var table_aztecs = appendElement("table", win.content, {border:0}, "width:190px");
		tr = appendElement("th", table_aztecs, {textContent:__locale.aztecs, colSpan:2});
			createBundle("aztecs_zoom", tr, false, "float:left");
		
		for(i in this.ship_data) {
			if(i=="vikings_scout_ship" || i=="vikings_trade_ship" || i=="vikings_transport_ship" || i=="vikings_island_breaker" || i=="aztecs_scout_ship" || i=="aztecs_trade_ship" || i=="aztecs_transport_ship" || i=="aztecs_island_breaker")
				continue;
			else if(i=="romans_scout_ship" || i=="romans_transport_ship" || i=="romans_trade_ship" || i=="romans_island_breaker")
				tr = appendElement("tr", table_general);
			
			else if(i.slice(0,6) == "romans")
				tr = appendElement("tr", table_romans);
			
			else if(i.slice(0,7) == "vikings")
				tr = appendElement("tr", table_vikings);
			
			else if(i.slice(0,6) == "aztecs")
				tr = appendElement("tr", table_aztecs);
			else
				tr=appendElement("tr", table_npc);
			appendElement("td", tr, {textContent:this.ship_data[i][0]+":"}, "font-weight:bold");
			
			appendElement("td", tr, {textContent:this.parseTime(Math.sqrt(Math.pow(this._currentX - data.myX,2)+Math.pow(this._currentY - data.myY,2))/this.ship_data[i][1])}, "text-align:right");
		}
			
		
		win.insert();
		return true;
	},
	update: function(state) {
		this._state.removeChild(this._current_state);
		switch(state) {
			case this.WORLDMAP:
				this._state.appendChild(this._current_state=this._state_worldmap);
				
				var minimap = Minimap,
					posX = (-minimap._mapX+minimap._minimap_pos_maxX)/minimap._minimap_zoom_percent + minimap._map_view_width/2, 
					posY = (-minimap._mapY+minimap._minimap_pos_maxY)/minimap._minimap_zoom_percent + minimap._map_view_height/2;
					pos = minimap.calc_world_pos(posX, posY);
					
				this._currentX = pos[0];
				this._currentY = pos[1];
				this.show_marker(this._worldmap_marker);
			break;
			case this.SEAMAP:
				this._state.appendChild(this._current_state=this._state_seamap, this._main.firstChild);
				
				this._currentX = Minimap.worldX + window.innerWidth/2;
				this._currentY = Minimap.worldY + window.innerHeight/2;
				this.show_marker(this._seamap_marker);
			break;
			case this.RINGMENU:
				this._state.appendChild(this._current_state=this._state_ringmenu);
				
				var pos = Ringmenu.get_position();
				this._currentX = pos[0];
				this._currentY = pos[1];
		}
		
		this.exploreTime();
		this.shipTime("romans_scout_ship");
		this.shipTime("romans_island_breaker");
		this.shipTime("romans_transport_ship");
		this.shipTime("romans_trade_ship");
	},
	
	show_marker: function(el, no_init) {
		if(!no_init) {
			if(el.style.display != "block")
				window.setTimeout(function() {Ship_data.show_marker(el, true);}, 700);
			
			el.style.display = "block";
			el.style.opacity = 1;
		}
		else {
			el.style.opacity -= 0.25;
			if(el.style.opacity <= 0)
				el.style.display = "none";
			else
				window.setTimeout(function() {Ship_data.show_marker(el, true);}, 50);
		}
	}
}

Sidebar = {
	DISPLAYED_AREA: 1,
	CACHE: 2,
	opened: false,
	_openGuilds: {},
	_current_list:1,
	_list_div:null,
	hidden_isls: {$:0},
	_search_field: null,
	
	
	init: function() {
		this._current_list = this.DISPLAYED_AREA;
		//hack to vary size of screen:
		this._game_widget = gid("game_widget");
		this._game_widget.style.width = "auto";
		this._game_widget.style.marginRight = 0;
		this._game_widget.style.marginLeft = 0;
		
		
		this._list_div = appendElement("div", false, false, "position:absolute; right:0; top:0; height:inherit; width:140px; z-index:100; background: linear-gradient(to right, #85806C , #C7C1A1 20px); border-left:3px ridge white; color:white; font-size:small;");
		
		this._status = appendElement("div", this._list_div, {textContent:__locale.displayed_area}, "position:absolute; left:0; right:0; top:0; padding-bottom:12px; text-align:center; background:url('http://themes.static.escaria.com/default/main_bar_bottom.png') repeat-x; color:white; font-weight:bold;"),
		this._displayed_area_icon = createBundle("displayed_area_icon", this._list_div, {className:"GM_clickable"}, "position:absolute; left:20px; top:15px;"),
		this._cache_icon = createBundle("cache_icon", this._list_div, {className:"GM_clickable"}, "position:absolute; left:80px; top:15px; opacity:0.5;");
		
		EventBox.bind(this._displayed_area_icon, "mouseup", function() {
				this._current_list = this.DISPLAYED_AREA;
				
				this.make_list();
			}, false, this);
		
		EventBox.bind(this._cache_icon, "mouseup", function() {
				this._current_list = this.CACHE;
				
				this.make_list();
			}, false, this);
		
		this._content = appendElement("div", this._list_div, false, "overflow-x:hidden; position:absolute; left:0; right:0; top:70px; bottom:30px; padding-left:25px;");
		
		
		this._search_field = appendElement("input", this._list_div, {type:"text", className:"GM_searchfield"}, "position:absolute; right:2px; bottom:2px");
		var desc = appendElement("div", this._list_div, {textContent:"Filter:"}, "position:absolute; right:85px; bottom:5px; color:black; font-weight:bold;"),
			close = createBundle("close", this._list_div, {className:"GM_clickable"}, "position:absolute; right:85px; bottom:2px; display:none");
		
		EventBox.bind(this._search_field, "keyup", function() {
				if(this.value.length) {
					close.style.display = "block";
					desc.style.display = "none";
				}
				else {
					close.style.display = "none";
					desc.style.display = "block";
				}
				Sidebar.make_list();
			});
		EventBox.bind(close, "mouseup", function() {
				Sidebar._search_field.value = "";
				desc.style.display = "block";
				this.style.display = "none";
				Sidebar.make_list();
			});
		
		
		var hider = createBundle("arrow_left_big", this._list_div, {className:"GM_clickable"}, "position:absolute; left:-20px; top:50px;");
		EventBox.bind(hider, "mouseup", this.close, false, this);
		
		this._opener_button = createBundle("arrow_right_big", gid("seamap"), {className:"GM_clickable"}, "position:absolute; right:-8px; top:50px;");
		EventBox.bind(this._opener_button, "mouseup", this.open, false, this);
		
		this._hidden_isls_indicator = createBundle("enemy_zoom", gid("seamap"), {className:"GM_clickable", textContent:"0", title:"Momentan durch die Seitenleiste ausgeblendete Inseln!"}, "position:absolute; right:20px; top:35px; display:none; font-size:x-small; font-weight:bold; color:white; text-align:center; line-height:33px;");
		
		EventBox.bind(this._hidden_isls_indicator, "mouseup",
				function() {
					var hidden_isls = this.hidden_isls,
						islands = Data.islands,
						isl, c;
					for(var i in hidden_isls) {
						if(i == "$")
							continue;
						isl = islands[i];
						this._toggle_island_hide(false, isl, hidden_isls);
						
						if((c = gid("GM_checkbox_"+isl.user)))
							c.checked = true;
					}
				}, false, this);
		
		
		EventBox.addListener(this._content, "mouseover");
		EventBox.addListener(this._content, "mouseout");
		EventBox.addListener(this._search_field, "keyup");
		EventBox.createPackage("sidebar");
	},
	make_list: function() {
		if(this._current_list == this.DISPLAYED_AREA) {
			this._displayed_area_icon.style.opacity = "1";
			this._cache_icon.style.opacity = "0.5";
			this._status.textContent = __locale.displayed_area;
			var displayed_area = true;
		}
		else {
			this._displayed_area_icon.style.opacity = "0.5";
			this._cache_icon.style.opacity = "1";
			this._status.textContent = __locale.cache;
			var displayed_area = false;
		}
		
		
		var marks_guild = Pref.marks_guild,
			guilds = Data.guilds,
			div = this._content,
			guild_index = (displayed_area ? this.create_active_guild_index() : this.create_guild_index(guilds, filter)),
			i = guild_index.length,
			j, guild, block, header_div, block_div, color;
		
		EventBox.emptyPackage("sidebar");
		div.innerHTML = "";
		div.style.display = "none";
		
		while(i--) {
			block = guild_index[i];
			guild = block[0].guild;
			switch(block[0].dipl) {
				case FRIEND:
					color = "green";
				break;
				case ALLY:
					color = "royalblue";
				break;
				case ENEMY:
					color = "red";
				break;
				default:
					if(marks_guild.hasOwnProperty(guild) && marks_guild[guild] != "transparent")
						color = marks_guild[guild];
					else
						color = "black";
			}
			header_div = appendElement("div", div, {textContent:guild, className:"GM_clickable", id:"GM_list_"+guild}, "background:url('http://themes.static.escaria.com/default/main_bar_bottom.png') repeat-x; height:24px; padding:3px 20px; margin-left:-25px; border-radius:5px; font-weight:bold; color:"+color+";");
			
			EventBox.bind_p("sidebar", header_div, "mouseover", function(block) {
				var el;
				for(var i in block) {
					el = gid(block[i].id);
					if(el)
						el.className = "GM_island_highlight islandIcon";
				}
				return true;
			}, [block]);
			EventBox.bind_p("sidebar", header_div, "mouseout", function(block) {
				var el;
				for(var i in block) {
					el = gid(block[i].id);
					if(el)
						el.className = "islandIcon";
				}
			}, [block]);
			
			
			EventBox.bind_p("sidebar",
					appendElement("input", header_div, {type:"checkbox", title: "auf der Seekarte ein- / ausblenden", checked:true}, "float:left"), "mouseup",
					function(block, e) {
						var c = e.GM_target.checked,
							hidden_isls = Sidebar.hidden_isls,
							toggle_island_hide = Sidebar._toggle_island_hide,
							isl, el, checkbox;
						
						for(var i in block) {
							isl = block[i];
							toggle_island_hide.apply(Sidebar, [c, isl, hidden_isls]);
							
							if((checkbox = gid("GM_checkbox_"+isl.user)))
								checkbox.checked = !c;
						}
					}, [block]);
					
			
			block_div = appendElement("div", div, {className:"directionIndicatorsOn"}, "display:"+(this._openGuilds.hasOwnProperty(guild) ? "block" : "none")+";");
			
			EventBox.bind_p("sidebar", header_div, "mouseup", function(div, guild) {
					if(div.style.display == "none") {
						div.style.display = "block";
						this._openGuilds[guild] = true;
					}
					else {
						div.style.display = "none";
						delete this._openGuilds[guild];
					}
					
					return true;
				}, [block_div, guild], this);
			
			var filter = this._search_field.value;
			if(filter.length) {
				var user_text;
				for(j in block) {
					user_text = block[j].user;
					if((filter_pos = user_text.indexOf(filter)) != -1)
						block_div.appendChild(this.create_island(block[j], filter_pos, filter));
				}
				if(!block_div.childNodes.length)
					header_div.style.display = "none";
			}
			else {
				for(j in block) {
					block_div.appendChild(this.create_island(block[j]));
				}
			}
		}
		div.style.display = "block";
	},
	create_guild_index: function(guilds) {
		var index = [],
			i, j, k_low;
		for(k in guilds) {
			guilds[k].sort(function(isl1, isl2) {return isl1.user.toLowerCase() < isl2.user.toLowerCase() ? -1 : 1});
			i = index.length;
			
			k_low = k.toLowerCase();
			while(i--) {
				if(k_low <= index[i][0].guild.toLowerCase()) {
					index.splice(i+1, 0, guilds[k]);
					break;
				}
			}
			if(i<0)
				index.splice(0,0,guilds[k]);
		}
		return index;
	},
	create_active_guild_index: function() {
		var index = [], user_index,
			els = Data.isl_div.childNodes,
			i = els.length, j, k,
			el, isl, guild, guild_div, user;
		
		while(i--) {
			el = els[i];
			
			if(!el.hasAttribute("GM_seamapPlus_checked") || el.hasAttribute("GM_seamapPlus_ignore"))
				continue;
			
			isl = Data.islands[toChild(el,5).textContent];
			if(!isl)
				continue;
			
			if(!isl.id) {//incomplete guild-members
				[isl.nation, isl.dive] = Data.get_isl_nation(el);
				isl.id = el.id;
			}
			
			j = index.length;
			guild = isl.guild.toLowerCase();
			
			while(j--) {
				if(guild < (guild_div=index[j][0].guild.toLowerCase())) {
					index.splice(j+1,0,[isl]);
					break;
				}
				else if(guild == guild_div) {
					user_index = index[j];
					k = user_index.length;
					user = isl.user.toLowerCase();
					
					while(k--) {
						if(user > user_index[k].user.toLowerCase()) {
							user_index.splice(k+1,0,isl);
							break;
						}
					}
					if(k<0)
						user_index.splice(0,0,isl);
					
					break;
				}
			}
			if(j<0)
				index.splice(0,0,[isl]);
		}
		return index;
	},
	create_island: function(isl, filter_pos, filter) {
		var in_reach = gid(isl.id) !== null,
			main = appendElement("div", false, {className:"islandIcon"}, "position:static; height:75px; color:black; margin:25px 0;"+(in_reach ? "" : "opacity:0.5")),
			clicker = appendElement("div", main, false, "position:absolute; height:75px; width:100%; cursor:pointer; margin-top:-15px; margin-left:-25px; z-index:3");
		
		EventBox.bind_p("sidebar", clicker, "mouseup", function(isl, e) {
			if(e.button == 1)
				Minimap.scroll_mapTo(Minimap.calc_map_pos(isl.x, isl.y));
			else
				Minimap.jump_worldTo(isl.x, isl.y);
			return true;
		}, [isl]);
		EventBox.bind_p("sidebar", clicker, "mouseover", function(isl) {
			var el = gid(isl.id);
			if(el)
				el.className = "GM_island_highlight islandIcon";
		}, [isl]);
		EventBox.bind_p("sidebar", clicker, "mouseout", function(isl) {
			var el = gid(isl.id);
			if(el)
				el.className = "islandIcon";
		}, [isl]);
		
		EventBox.bind_p("sidebar", 
				appendElement("input", main, {type:"checkbox", checked:!Sidebar.hidden_isls[isl.user], title: "auf der Seekarte ein- / ausblenden", id:"GM_checkbox_"+isl.user}, "position:absolute; margin:-15px 0 0 -20px; z-index:4"),
				"mouseup",
				function(isl, e) {
					Sidebar._toggle_island_hide.apply(Sidebar, [e.GM_target.checked, isl, Sidebar.hidden_isls]);
				}, [isl])
		
		var island = appendElement("div", main, false, "position:absolute");
		
		
		
		var inf = appendElement("a", island, {className:"seamapEntityInfoPanel"});
			//user_div = appendElement("div", inf, {textContent:user_text, className:"GM_island_marked"}, "display:inline; background-color:"+(Pref.marks_player[isl.user] || "transparent")+";");
			
		if(filter_pos !== undefined) {
			var user_div = appendElement("div", inf, {className:"GM_island_marked"}, "display:inline; background-color:"+(Pref.marks_player[isl.user] || "transparent")+";");
			
			user_div.appendChild(document.createTextNode(isl.user.substring(0, filter_pos)));
			appendElement("span", user_div, {textContent:filter}, "background-color: grey; color:white");
			user_div.appendChild(document.createTextNode(isl.user.substring(filter_pos + filter.length)));
		}
		else
			appendElement("div", inf, {textContent:isl.user, className:"GM_island_marked"}, "display:inline; background-color:"+(Pref.marks_player[isl.user] || "transparent")+";");
		
		
		
		var hs = Hs_tree.get_value(isl.x, isl.y);
		
		if(hs[0]) {
			var highlevel = Math.min(hs[1][1], Pref.highlevel),
				lowlevel = Math.max(hs[1][0], Pref.lowlevel);
		}
		else {
			var highlevel = Pref.highlevel,
				lowlevel = Pref.lowlevel;
		}
		
		if(isl.lvl > highlevel)
			appendElement("div", inf, {textContent:" ("+isl.lvl+")", className:"GM_island_marked"}, "display:inline; border:1px solid white; background-color:red");
		else if(isl.lvl < lowlevel)
			appendElement("div", inf, {textContent:" ("+isl.lvl+")", className:"GM_island_marked"}, "display:inline; border:1px solid white; background-color:yellowgreen");
		else
			appendElement("div", inf, {textContent:" ("+isl.lvl+")"}, "display:inline");
		
		if(isl.guild != __locale.noGuild)
			appendElement("div", inf, {textContent:isl.guild, className:"GM_island_marked"},  "width:45px; background-color:"+(Pref.marks_guild[isl.guild] || "transparent")+";");
		
		
		
		switch(isl.dir) {
			case false:
				var dir = false;
			break;
			case Data.RIGHT:
				var dir = "east";
			break;
			case Data.RIGHT_DOWN:
				var dir = "south_east";
			break;
			case Data.DOWN:
				var dir = "south";
			break;
			case Data.LEFT_DOWN:
				var dir = "south_west";
			break;
			case Data.LEFT:
				var dir = "west";
			break;
			case Data.LEFT_UP:
				var dir = "north_west";
			break;
			case Data.UP:
				var dir = "north";
			break;
			case Data.RIGHT_UP:
				var dir = "north_east";
			break;
		}
		if(dir)
			createBundle("arrow_"+dir, island, {className:"islandsDirection"}, "left:-50px; top:-50px");
		
		if(isl.boost)
			appendElement("div", island, {className:dir ? "foam_0 foam_0_" + dir: "foam_0_no_direction"});
		
		
		
		switch(isl.nation) {
			case ROMANS:
				var nation = "romans";
			break;
			case VIKINGS:
				var nation = "vikings";
			break;
			case AZTECS:
				var nation = "aztecs";
			break;
			default:
				var nation = "unknown";
		}
		
		
		if(isl.dipl) {
			switch(isl.dipl) {
				case ALLY:
					var dipl = "ally";
				break;
				case FRIEND:
					var dipl = "friend";
				break;
				case ENEMY:
					var dipl = "enemy";
					
			}
			createBundle(dipl, island, {className:"islandAlignmentIndicator"});
		}
		createBundle((isl.dive ? nation+"_dive" : nation), island, {className:"extendedHTML islandsImage"}, "position:relative;");
		
		
		if(isl.attack)
			createBundle('redSkull', island, {className:'extendedHTML killableStatusIcon'});
		
		return main;
	},
	
	_toggle_island_hide: function(checkbox_checked, isl, hidden_isls) {
		var isl_el = gid(isl.id);
		if(checkbox_checked) { //.checked is updated after mouseup-Event
			if(hidden_isls[isl.user])
				return;
			if(isl_el)
				isl_el.style.display = "none";
			hidden_isls[isl.user] = true;
			++hidden_isls.$;
		}
		else {
			if(!hidden_isls[isl.user])
				return;
			if(isl_el)
				isl_el.style.display = "block";
			delete hidden_isls[isl.user];
			--hidden_isls.$;
		}
		this._hidden_isls_indicator.textContent = hidden_isls.$;
		this._hidden_isls_indicator.style.display = (hidden_isls.$) ? "block" : "none";
	},
	
	openGuild: function(guild) {
		EventBox.event(gid("GM_list_"+guild), "mouseup");
	},
	
	update: function() {
		if(!this.opened)
			return;
		this.make_list();
	},
	open: function(list) {
		if(this.opened) {
			if(list != this._current_list)
				this.make_list();
			return;
		}
		if(list && typeof list == "number")
			this._current_list = parseInt(list);
		this._game_widget.style.marginRight = "140px";
		this._game_widget.appendChild(this._list_div);
		this._opener_button.style.display = "none";
		this.make_list();
		this.opened = true;
		
		if(Pref.minimap_expanded)
			Minimap.toggle_expand();
		
		return true;
	},
	close: function() {
		if(!this.opened)
			return;
		this._game_widget.style.marginRight = "0";
		this._game_widget.removeChild(this._list_div);
		this._opener_button.style.display = "block";
		EventBox.emptyPackage("sidebar");
		
		gid("gvSeamap").firstChild.nextSibling.firstChild.style.width = window.innerWidth+"px";
		this.opened = false;
		return true;
	}
}

Ringmenu = {
	_ringmenu: null,
	
	_item_playerProfile: null,
	_ringmenu_button_player: null,
	_ringmenu_button_guild: null,
	_ringmenu_player_inserted: false,
	_ringmenu_guild_inserted: false,
	_ringmenu_to_centerX:0,
	_ringmenu_to_centerY:0,
	
	init: function() {
		this._ringmenu_button_player = createBundle("add_island_icon", false, {className:"GM_clickable", title:__locale.mark_player}, "position:absolute; left:0; top:45px; clip: rect(5px, 24px, 27px, 3px)");
		this._ringmenu_button_guild = createBundle("add_guild_icon", false, {className:"GM_clickable", title:__locale.mark_guild}, "position:absolute; left:19px; top:52px; clip: rect(3px, 20px, 27px, 5px)");
		
		this._ringmenu_button_player_delete = this._ringmenu_button_player.cloneNode(false);
		var del_player = createBundle("del", this._ringmenu_button_player_delete, {className:"GM_clickable"}, "position:absolute; left:6px; top:8px;");
		
		this._ringmenu_button_guild_delete = this._ringmenu_button_guild.cloneNode(false);
		var del_guild = createBundle("del", this._ringmenu_button_guild_delete, {className:"GM_clickable"}, "position:absolute; left:6px; top:8px;");
		
		EventBox.bind(this._ringmenu_button_player, "mouseup", function() {Minimap.add_listItem("marks_player", Ringmenu.get_ringmenu_data(this.parentNode)[2])});
		EventBox.bind(this._ringmenu_button_guild, "mouseup", function() {Minimap.add_listItem("marks_guild", Ringmenu.get_ringmenu_data(this.parentNode)[1])});
		EventBox.bind(del_player, "mouseup", function() {Minimap.delete_marker("marks_player", Ringmenu.get_ringmenu_data(this.parentNode.parentNode)[2])});
		EventBox.bind(del_guild, "mouseup", function() {Minimap.delete_marker("marks_guild", Ringmenu.get_ringmenu_data(this.parentNode.parentNode)[1])});
		
		this._ringmenu = gid("seamapRingMenu");
		this._item_playerProfile = gid("menu_item_playerProfile");
		this._ringmenu_to_centerX = Math.floor(parseInt(this._ringmenu.style.width.slice(0,-2))/2);
		this._ringmenu_to_centerY =  Math.floor(parseInt(this._ringmenu.style.height.slice(0,-2))/2);
		
		EventBox.addListener(gid("menu_item_move").lastChild, "mouseup");
		EventBox.bind(gid("menu_item_move").lastChild, "mouseup", function() {Minimap.setCourse();}, false, Minimap);
		
		var el = this._ringmenu.lastChild;
		while(el.className != "ThemeLabel")
			el = el.previousSibling;
		this._position_div = el.firstChild.firstChild.childNodes[1]; //assuming, that the last escaria-element is the right one - no way of telling right now...
		
		this._indicatorX = getEl("./div[@class='coordinateIndicatorPanel']/div[@class='coordinateIndicatorHorizontal']", gid("seamap")).snapshotItem(0);
		this._indicatorY = getEl("./div[@class='coordinateIndicatorPanel']/div[@class='coordinateIndicatorVertical']", gid("seamap")).snapshotItem(0);
		
		EventBox.createPackage("ringmenu");
	},
	check: function() {
		if(this._ringmenu.style.display == "none")
			return;
		
		this.reset_ringmenu();
		Ship_data.update(Ship_data.RINGMENU);
		
		if(this._item_playerProfile.className == "clickable") {//one island
			var data = this.get_ringmenu_data(this._item_playerProfile);
			if(!data)//npc
				return;
			
			if(data[2] != Data.myUsername) {
				if(Pref.marks_player.hasOwnProperty(data[2])) {
					this._item_playerProfile.appendChild(this._ringmenu_button_player_delete);
					this._ringmenu_player_delete_inserted = true;
				}
				else {
					this._item_playerProfile.appendChild(this._ringmenu_button_player);
					this._ringmenu_player_inserted = true;
				}
			}
			if(data[1]) {
				if(Pref.marks_guild.hasOwnProperty(data[1])) {
					this._item_playerProfile.appendChild(this._ringmenu_button_guild_delete);
					this._ringmenu_guild_delete_inserted = true;
				}
				else {
					this._item_playerProfile.appendChild(this._ringmenu_button_guild);
					this._ringmenu_guild_inserted = true;
				}
			}
		}
		else {//multiple islands
			var buttons = getEl("./div[contains(@id, 'menu_item_playerProfile_island')]", gid("seamapRingMenu")),
				button, data, del
				i = buttons.snapshotLength;
			
			while(i--) {
				button = buttons.snapshotItem(i);
				data = this.get_ringmenu_data(button);
				
				if(data[2] != Data.myUsername) {
					if(Pref.marks_player.hasOwnProperty(data[2]))
						button.appendChild(this._ringmenu_button_player_delete.cloneNode(true));
					else
						button.appendChild(this._ringmenu_button_player.cloneNode(false));
				}
				if(data[1]) {
					if(Pref.marks_guild.hasOwnProperty(data[1]))
						button.appendChild(this._ringmenu_button_guild_delete.cloneNode(true));
					else
						button.appendChild(this._ringmenu_button_guild.cloneNode(false));
				}
			}
		}
	},
	get_position: function() {
		var dist = this._position_div.textContent.match(/(-?\d+)\/(-?\d+)/);
		if(!dist)
			return Minimap.world_isZoomed ?
					[this._indicatorX.textContent - this._indicatorX.style.left.slice(0,-2)*2, this._indicatorY.textContent - this._indicatorY.style.top.slice(0,-2)*2] : 
					[this._indicatorX.textContent - this._indicatorX.style.left.slice(0,-2), this._indicatorY.textContent - this._indicatorY.style.top.slice(0,-2)];
					
		return [parseInt(dist[1]), parseInt(dist[2])];
	},
	get_ringmenu_data: function(el) {
		var data;
		//NOTE: will be checked everytime, even if we know that it wouldnt find anything
		//we dont care...
		if(data = el.firstChild.title.match(__locale.regExpRingmenu))
			return data;
		
		var data_el = gid("seamapRingMenu").lastChild.previousSibling;
		while(data_el.className != "ThemeLabel" || !(data = toChild(data_el,3).nextSibling.textContent.match(__locale.regExpRingmenu))) {
			if(!(data_el = data_el.previousSibling))
				return false;//npc
		}
		return data;
	},
	reset_ringmenu: function() {
		EventBox.emptyPackage("ringmenu");
		if(this._ringmenu_player_inserted) {
			this._ringmenu_player_inserted = false;
			this._item_playerProfile.removeChild(this._ringmenu_button_player);
		}
		else if(this._ringmenu_player_delete_inserted) {
			this._item_playerProfile.removeChild(this._ringmenu_button_player_delete);
			this._ringmenu_player_delete_inserted = false;
		}
				
		if(this._ringmenu_guild_inserted) {
			this._item_playerProfile.removeChild(this._ringmenu_button_guild);
			this._ringmenu_guild_inserted = false;
		}
		else if(this._ringmenu_guild_delete_inserted) {
			this._item_playerProfile.removeChild(this._ringmenu_button_guild_delete);
			this._ringmenu_guild_delete_inserted = false;
		}
	},
	get_ringmenuPos: function() {
		var x = parseInt(this._ringmenu.style.left.slice(0,-2)) + this._ringmenu_to_centerX,
			y = parseInt(this._ringmenu.style.top.slice(0,-2)) + this._ringmenu_to_centerY;
		
		if(Minimap.world_isZoomed) {
			x = x*2;
			y = y*2;
		}
		
		return [x,y];
	},
	
	update_world_pos: function() {
		if(this._ringmenu.style.display == "none") {
			do_action(gid("gvSeamap"), "mouseup", false, 0, 0);
			do_action(gid("gvSeamap"), "mouseup", false, 0, 0);
			if(this._ringmenu.style.display != "none")//when mouse was released outside seamap
				do_action(gid("gvSeamap"), "mouseup", false, 0, 0);
			
			var pos = this.get_position();
			Minimap.worldX = pos[0];
			Minimap.worldY = pos[1];
		}
		else {
			if(Minimap.world_isZoomed) {
				var subX = (parseInt(this._ringmenu.style.left.slice(0,-2)) + this._ringmenu_to_centerX)*2,
					subY = (parseInt(this._ringmenu.style.top.slice(0,-2)) + this._ringmenu_to_centerY)*2;
			}
			else {
				var subX = (parseInt(this._ringmenu.style.left.slice(0,-2)) + this._ringmenu_to_centerX),
					subY = (parseInt(this._ringmenu.style.top.slice(0,-2)) + this._ringmenu_to_centerY);
			}
			
			var pos = this.get_position();
			Minimap.worldX = pos[0] - subX;
			Minimap.worldY = pos[1] - subY;
		}
	}
};


//**********
//init
//**********

Init = {
	in_progress:3,
	
	boot: function() {
		__release = get_localVar("clientAssetsBasePath");
		Data.myUsername = get_localVar("worldUsername");
		Data.myTribe = get_localVar("tribe");
		Data.myId = get_localVar("islandId");
		var map_data = get_localVar("worldSeaChartDimensionInformationString");
		
		
		Pref.load("minimap_zoom", 1, true);
		Pref.load("icon_size", 4, true);
		Pref.load("cacheMax", 500);
		Pref.load("delay_time", 500);
		Pref.load("lowlevel", 4);
		Pref.load("highlevel", 100);
		Pref.load("minimap_width", 180);
		Pref.load("minimap_height", 180);
		Pref.load("history_max", 50);
		
		Pref.load_bool_package([
				"tutorial_skip",
				"minimap_enabled",
				"minimap_expanded",
				"scroll_with_seamap",
				"list_enabled",
				"radius",
				"cache_save_friends",
				"cache_save_ally",
				"cache_save_enemys",
				"cache_save_marked",
				"show_island_names",
				"show_npc",
				"show_own_island",
				"show_destination",
				"show_positions",
				"show_mark_player",
				"show_mark_guild",
				"show_standing",
				"show_moving",
				"show_attacking",
				"show_highlevels",
				"show_lowlevels",
				"show_friends",
				"show_allys",
				"show_enemys"
			]);
		
		Pref.load_array("positions");
		Pref.load_array("position_keys");
		Pref.load_object("marks_player");
		Pref.load_object("marks_guild");
		
		Pref.load("lang", get_localVar("worldLocale"));
		if(Pref.lang == "de")
			__locale = {
				options: "Einstellungen",
				positions: "Positionen",
				guilds: "Gilden",
				player: "Spieler",
				general: "Allgemein",
				romans: "Römer",
				vikings: "Wikinger",
				aztecs: "Azteken",
				npcs: "NPCs",
				highlevel: "Highlevel-Inseln",
				lowlevel: "Lowlevel-Inseln",
				color: "Farbe",
				friends: "Gildenmitglieder",
				allys: "Verbündete",
				enemys: "Feinde",
				marked: "Markierte Inseln",
				displayed_area: "Anzeigebereich",
				destination: "Fahrziel",
				cache: "Cache",
				troop_time: "Truppenzeiten",
				explore: "Erkundung",
				island_names: "Inselnamen",
				guild_short: "Gilden-Kürzel",
				attacking: "Angreifer-Inseln",
				islandTypes: "Insel-Typen",
				player_mark: "Insel-Markierung",
				guild_mark: "Gilden-Markierung",
				mark_player: "Spiler-Markierung hinzufügen",
				mark_guild: "Gilden-Markierung hinzufügen",
				ringmenu_position: "Ringmenu-position",
				seamap_position: "Seekarten-Position",
				worldmap_position: "Weltkarten-Position",
				own_island: "Eigene Insel",
				standing_island: "stehende Inseln",
				moving_island: "bewegende Inseln",
				marked_player: "markierte Spieler",
				marked_guilds: "markierte Gilden",
				noGuild: "gildenlos",
				add: "hinzufügen",
				display: "einfügen",
				toggle_worldmap_options: "Weltkarten-Filtermenü Ein/Aus",
				jumpToPlayer: "Mit Weltkarte zur eigenen Insel springen",
				jumpToView: "Mit Weltkarte zum aktuellen Seekarten-Sichtbereich springen",
				jumpToDest: "Mit Weltkarte zum Fahrziel der Insel springen",
				saving_position: "Wie soll diese Position benannt werden?",
				home_button_title: "Zur eigenen Insel",
				regExpRingmenu:/von (\[[^\]]+\])*(.+) /
			};
		
		this.waitingId=window.setInterval(Init.wait_for_it, 1000);
	},
	_move_worldmapData: function() {
		document.body.className =  "GM_move_stuff";
		do_action(gid("menu_item_worldMap"), "click", true);
		window.setTimeout(function() {
			var parent = getEl("./div[@class='gwt-DialogBox']/div/table//div[@class='dialogMiddleCenterInner dialogContent']/table", document.body).snapshotItem(0),
				viewport = getEl(".//div[@class='viewport']", parent).snapshotItem(0),
				guildPanel = getEl(".//div[@class='seaChartGuildMemberPanel']", viewport).snapshotItem(0);
			
			if(!viewport || !guildPanel) {
				Init._move_worldmapData();
				return;
			}
			else if(!guildPanel.childNodes.length) {
				var el;
				if(Data.myGuild && (!(el=getEl(".//div[@class='guildMembershipPanel']", gid("guild")).snapshotItem(0)) || parseInt(el.firstChild.textContent.match(/.+\((\d+)\)/)[1])) > 1) {
					Init._move_worldmapData();
					return;
				}
			}
			else {
				//guildmember
				var data = Data,
					myGuild = data.myGuild,
					isls = Data.islands,
					minimap = Minimap,
					els = guildPanel.childNodes,
					i = els.length,
					el, user, isl, pos;
				
				if(i && !data.guilds.hasOwnProperty(myGuild))
					data.guilds[myGuild] = [];
				var guild_a = data.guilds[myGuild];
				
				data._cache_num += i;
				
				while(i--) {
					el = els[i];
					user = el.title;
					
					pos = minimap.calc_world_pos(parseInt(el.style.left.slice(0,-2))+5, parseInt(el.style.top.slice(0,-2))+5);
					if(isls.hasOwnProperty(user)) {
						isl = isls[user];
						isl.dipl = FRIEND;
						isl.x = pos[0];
						isl.y = pos[1];
					}
					else {
						isl = isls[user] = {user:user, id:false, nation:UNKNOWN, npc:false, guild:myGuild,
								dir:Data.STAYS, dipl:FRIEND, boost: false, lvl:0,
								x:pos[0],
								y:pos[1],
								dive:false, name_el:false, dir_el:false};
						minimap.add_island(isl);
						guild_a.push(isl);
					}
					minimap.update_island(isl);
					
				}
			}
			//destination
			var chart = viewport.firstChild.lastChild,
				ownPosition = chart.childNodes[1],
				dest = chart.childNodes[2];
			
			if(dest.style.display != "none") {
				Minimap.setCourse(
						parseInt(dest.style.left.slice(0,-2))+parseInt(dest.style.width.slice(0,-2))/2,
						parseInt(dest.style.top.slice(0,-2))+parseInt(dest.style.height.slice(0,-2))/2
					);
			}
			
			if(Init.in_progress)
				Init.check_finished();
			do_action(getEl(".//div[@title][@class='HtmlImage'][contains(@style, 'z-index: 1002')][contains(@style, 'background-position: "+__bundles.close[3]+"')]", parent).snapshotItem(0), "click", true);
			document.body.className =  "";
			
		}, 50);
	},
	_move_boost_el: function() {
		//add_class(document.body, "GM_move_stuff");
		document.body.className =  "GM_move_stuff";
		do_action(gid("menu_item_accelerateIsland"), "click", true, 0, 0);
		window.setTimeout(function() {
			var booster_el = getEl("./div[@class='gwt-DialogBox accelerateIslandPanel']//table[@class='remainingTimePanel']", document.body).snapshotItem(0);
			if(!booster_el) {
				Init._move_boost_el(Init);
				return;
			}
			
			booster_el.getElementsByTagName("td")[0].style.display = "none";
			booster_el.style.display = "inline-block";
			booster_el.style.verticalAlign = "middle";
			
			Minimap.booster_line.appendChild(booster_el);
			
			Init.check_finished();
			do_action(getEl("./div[@class='gwt-DialogBox accelerateIslandPanel']//div[@class='PopupCloseButton']", document.body).snapshotItem(0), "mouseup", true);
			//remove_class(document.body, "move_stuff");
			document.body.className =  "";
		}, 50);
	},
	getImageBundles: function(b) {
		appendElement('div', document.body, {id:'GM_seamap_moveVars_bundles', textContent:'notLoaded'}, 'display:none');
		var content = "var ausg='', e=document.getElementById('GM_seamap_moveVars_bundles');";
		for(var i in b)
			content +="ausg +='\""+i+"\":[\"url(\\\''+___stdlib_fastcall____startupConfiguration___.clientAssetsBasePath+image_bundle['"+b[i]+"'].bundleName+'\\\')\","
				+"\"'+(image_bundle['"+b[i]+"'].properties ? (image_bundle['"+b[i]+"'].width / image_bundle['"+b[i]+"'].properties.frames) : image_bundle['"+b[i]+"'].width)+'px\","
				+"\"'+image_bundle['"+b[i]+"'].height+'px\","
				+"\"'+(-image_bundle['"+b[i]+"'].x)+'px '+(-image_bundle['"+b[i]+"'].y)+'px\","
				+"\"'+bundle_defs[image_bundle['"+b[i]+"'].bundleName].width+'\","
				+"\"'+bundle_defs[image_bundle['"+b[i]+"'].bundleName].height+'\"],';";
			//content +="ausg +='\""+i+"\":[\"url(\\\''+___stdlib_fastcall____startupConfiguration___.clientAssetsBasePath+image_bundle['"+b[i]+"'].bundleName+'\\\')\","
				//+"\"'+(image_bundle['"+b[i]+"'].properties ? (image_bundle['"+b[i]+"'].width / image_bundle['"+b[i]+"'].properties.frames) : image_bundle['"+b[i]+"'].width)+'px\","
				//+"\"'+image_bundle['"+b[i]+"'].height+'px\","
				//+"\"'+(-image_bundle['"+b[i]+"'].x)+'px '+(-image_bundle['"+b[i]+"'].y)+'px\"],';";
			
		content+="e.textContent='{'+ausg.slice(0,-1)+'}';delete ausg; delete e;";
		document.body.removeChild(appendElement('script', document.body, {type:'application/javascript', textContent:content}));
	},
	getShipData: function() {
		appendElement("div", document.body, {id:"GM_seamap_moveVars_ships", textContent:"nA"}, "display:none");
		var script = appendElement("script", document.body, {type:"application/javascript",
		textContent:('var temp={set:function(a,b) {this[a]=b}}, noData={getValue:function(){return 0;}}, ausg2="", e=document.getElementById("GM_seamap_moveVars_ships");'
			+'for(var i in ships){'
				+'if(ships[i].object.skills && ships[i].object.skills.alive){'
					+'ships[i].object.skills.alive(temp, noData, noData);'
					+'ausg2 += \'"\'+i+\'":["\'+ships[i].title+\'",\'+temp.speed+"],";}'
			+'} e.textContent = "{"+ausg2.slice(0,-1)+"}";'
			+'delete temp; delete noData;delete e;delete ausg2;')});
		document.body.removeChild(script);
	},
	wait_for_it: function() {
		var els = getEl(".//a[contains(@class, 'islandIcon')]", gid("gvSeamap"));
		//if(!els.snapshotLength || !getEl("//div[@class='coordinateIndicatorHorizontal']").snapshotItem(0)) // || getEl... because get_world_pos() sometimes throws an error on siteload
		if(!els.snapshotLength)
			return;
		
		if(!gid('GM_seamap_moveVars_bundles')) {
			Init.getShipData();
			Init.getImageBundles({
				friend:"gfx/seamap/friend_indicator_0.png",
				friend_zoom:"gfx/seamap/friend_indicator_1.png",
				ally:"gfx/seamap/ally_indicator_0.png",
				ally_zoom:"gfx/seamap/ally_indicator_1.png",
				enemy:"gfx/seamap/ally_indicator_0.png",
				enemy_zoom:"gfx/seamap/enemy_indicator_1.png",
				romans:"gfx/buildings_romans/island_building_0.png",
				romans_zoom:"gfx/buildings_romans/island_building_1.png",
				romans_dive:"gfx/buildings_romans/island_building_dive_0.png",
				romans_zoom_dive:"gfx/buildings_romans/island_building_dive_1.png",
				vikings:"gfx/buildings_vikings/island_building_0.png",
				vikings_zoom:"gfx/buildings_vikings/island_building_1.png",
				vikings_dive:"gfx/buildings_vikings/island_building_dive_0.png",
				vikings_zoom_dive:"gfx/buildings_vikings/island_building_dive_1.png",
				aztecs:"gfx/buildings_aztecs/island_building_0.png",
				aztecs_zoom:"gfx/buildings_aztecs/island_building_1.png",
				aztecs_dive:"gfx/buildings_aztecs/island_building_dive_0.png",
				aztecs_zoom_dive:"gfx/buildings_aztecs/island_building_dive_1.png",
				unknown:"gfx/buildings_npc/boss_island_building_0.png",
				villains_zoom:"gfx/buildings_villains/island_building_1.png",
				redSkull:"gfx/icons/skull_red_seaview_icon.png",
				arrow_east:"gfx/ui/seaview_arrow_small_0.png",
				arrow_south_east:"gfx/ui/seaview_arrow_small_1.png",
				arrow_south:"gfx/ui/seaview_arrow_small_2.png",
				arrow_south_west:"gfx/ui/seaview_arrow_small_3.png",
				arrow_west:"gfx/ui/seaview_arrow_small_4.png",
				arrow_north_west:"gfx/ui/seaview_arrow_small_5.png",
				arrow_north:"gfx/ui/seaview_arrow_small_6.png",
				arrow_north_east:"gfx/ui/seaview_arrow_small_7.png",
				boost_zoom:"gfx/seamap/island_speed_no_direction_1.png",
				hand_ne:"gfx/ui/hand_static_ne.png",
				hand_se:"gfx/ui/hand_static_se.png",
				hand_sw:"gfx/ui/hand_static_sw.png",
				hand_nw:"gfx/ui/hand_static_nw.png",
				close:"gfx/ui/info_window_close.png",
				add:"gfx/posBookmarks/add.png",
				del:"gfx/posBookmarks/delete.png",
				expand:"gfx/ui/arrow.png",
				mini:"gfx/minimap/mini.png",
				maxi:"gfx/minimap/maxi.png",
				arrow_right:"gfx/posBookmarks/arrow_right.png",
				arrow_left:"gfx/posBookmarks/arrow_left.png",
				arrow_left_medium:"gfx/ui/arrow_back.png",
				arrow_right_medium:"gfx/ui/arrow_next.png",
				arrow_left_big:"gfx/ui/panel_right_arrow_1.png",
				arrow_right_big:"gfx/ui/panel_right_arrow_0.png",
				listIslands:"gfx/icons/content_icon_small.png",
				world_button: "gfx/icons/world_map_icon_small_0.png",
				merchant_destroyed:"gfx/animations_npc/trade_fleet_destroyed_0.png",
				npc_map1:"gfx/animations_npc/trade_fleet_moving_normal_1.png",
				npc_map2:"gfx/animations_npc/kraken_npc_arise_1.png",
				npc_map0:"gfx/buildings_npc/boss_island_building_1.png",
				hf:"gfx/animations_npc/trade_fleet_moving_normal_0.png",
				cache_icon: "gfx/icons/zoom_icon_small_0.png",
				displayed_area_icon: "gfx/icons/show_island_only_icon_0.png",
				dest_icon: "gfx/ui/seaview_target_1.png",
				add_guild_icon:"gfx/icons/logbook_guild_icon_small_0.png",
				add_island_icon:"gfx/icons/logbook_tile_icon_small_0.png",
				slider_arrow:"gfx/minimap/zoom_arrow.png",
				options:"gfx/icons/logbook_system_message_icon_small_0.png",
				question_mark1:"gfx/icons/question_mark_button_1.png",
				question_mark2:"gfx/icons/question_mark_button_2.png",
				bar_back:"gfx/ui/payment_bar_top.png"
				//bar_back:"gfx/ui_romans/progress_bar_inside.png",
				//bar_progress:"gfx/ui_romans/progress_bar_middle_red.png",
				//bar_front:"gfx/ui_romans/progress_bar_outside.png"
			});
		}
		if(gid("GM_seamap_moveVars_bundles").textContent =="notLoaded" || gid("GM_seamap_moveVars_ships").textContent=="nA")
			return;
		__bundles = JSON.parse(gid("GM_seamap_moveVars_bundles").textContent);
		Ship_data.ship_data = JSON.parse(gid("GM_seamap_moveVars_ships").textContent);
		document.body.removeChild(gid("GM_seamap_moveVars_bundles"));
		document.body.removeChild(gid("GM_seamap_moveVars_ships"));
		
		
		//
		//prepare page
		//
		
		/**Quelltext-Korrektur - doppelte IDs, schaemts euch! ->*/
			var el = getEl("./div[@class='seamapButtonMenu']/div[@id='menu_item_home']", gid("seamap")).snapshotItem(0);
			el.id = "seamap_menu_item_home";
		/**<-Ende*/
		
		
		Sidebar.init();
		Ringmenu.init();
		Dnd.init();
		Options.init();
		Radius.calc_radius();
		
		window.addEventListener("hashchange", hashchange);
		EventBox.addListener(document.body, "mouseup", mouseup);
		
		EventBox.bind(gid("menu_item_zoom"), "mouseup", Minimap.toggle_viewpoint_zoom, false, Minimap);
		EventBox.bind(gid("seamap_menu_item_home"), "mouseup", function() {
				window.setTimeout(function() {
						//Ringmenu.update_world_pos();
						Data.check_map();
						Minimap.jump_mapTo(Minimap.worldX, Minimap.worldY);
					}, Pref.delay_time);
				return true;
			});
		EventBox.cloneEvents([gid("menu_item_target")], ["mouseup"], gid("seamap_menu_item_home"));
		
		Init._move_worldmapData();
		//move_worldmapData();
		Init._move_boost_el();
		
		Minimap.create(get_localVar("worldSeaChartUrl"), get_localVar("worldSeaChartDimensionInformationString"));
		
		//__mainLoop_id=window.setInterval(function() {Data.check_map.apply(Data);}, 5000);
		
		
		Data.isl_div = (gid("gvSeamap").firstChild.nextSibling || gid("gvSeamap").firstChild).firstChild.nextSibling;
		Data.loop_islands();
		window.setInterval(function() {Data.loop_islands();}, 1000*60*2);
		
		Chat.init(); //has to happen after Data.loop_islands
		hashchange();
		
		window.clearInterval(Init.waitingId);
			
		Init.check_finished();
	},
	
	check_finished: function() {
		if(--this.in_progress)
			return;
		
		//delete Init;
		Tutorial.init();
	}
}

if(__server)
	Init.boot();

