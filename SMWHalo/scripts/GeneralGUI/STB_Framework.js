/*
 * Copyright (C) Vulcan Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program.If not, see <http://www.gnu.org/licenses/>.
 *
 */

/**
 * 
 * @file
 * @ingroup SMWHaloSemanticToolbar
 * @author: Thomas Schweitzer
 *  framework for menu container handling of STB++
 */

window.ToolbarFramework = Class.create();

window.FACTCONTAINER = 0; // contains already annotated facts
window.EDITCONTAINER = 1; // contains Linklist
window.TYPECONTAINER = 2; // contains datatype selector on attribute pages
window.CATEGORYCONTAINER = 3; // contains categories
window.ATTRIBUTECONTAINER = 4; // contains attrributes
window.RELATIONCONTAINER = 5; // contains relations
window.PROPERTIESCONTAINER = 6; // contains the properties of attributes and relations
window.RULESCONTAINER = 7; // contains rules
window.CBSRCHCONTAINER = 8; // contains combined search functions
window.COMBINEDSEARCHCONTAINER = 9;
window.WEBSERVICECONTAINER = 10;
window.HELPCONTAINER = 11; // contains help
window.ANNOTATIONHINTCONTAINER = 12; // gardening hints in AAM
window.SAVEANNOTATIONSCONTAINER = 13; // save annotations in AAM
window.DBGCONTAINER = 14; // contains debug information
window.ASKQUERYCONTAINER = 15; // contains query informations with links to QI
window.LASTCONTAINERIDX = 15;

window.STBIMGMINUS = '/extensions/SMWHalo/skins/Annotation/images/minus.gif'
window.STBIMGPLUS = '/extensions/SMWHalo/skins/Annotation/images/plus.gif'

ToolbarFramework.prototype = {

  /**
	 * @public
	 *
	 * Constructor.
	 */

  stbconstructor : function() {
    this.var_onto = $("ontomenuanchor");
    if (!this.var_onto) {
      this.var_onto = new Element('div', {
        'id' : 'ontomenuanchor'
      } )
      document.body.appendChild(this.var_onto);
    }

    // get existing cookies
    this.getCookieTab();

    // get initial tab from cookie!
    if (this.cookiePrefTab != null) {
      for (var i=0; i<this.cookiePrefTab.length; i++) {
        if (this.cookiePrefTab[i] == 1) {
          this.curtabShown = i;
        }
      }
    } else {
      this.curtabShown = 0;
    }
    this.isCollapsed = false;

    this.var_onto.innerHTML = this.createToolbarTitle();
			
    this.var_onto.innerHTML += '<div id="tabcontainer"></div>';
    this.var_onto.innerHTML += "<div id=\"activetabcontainer\"></div>";
    this.var_onto.innerHTML += "<div id=\"semtoolbar\"></div>";

    // create empty container (to preserve order of containers)

    this.var_stb = $("semtoolbar");
    if (this.var_stb) {
      for(var i=0;i<=LASTCONTAINERIDX;i++) {
        this.var_stb.innerHTML += "<div id=\"stb_cont"+i+"-headline\" class=\"generic_headline\"></div>";
        this.var_stb.innerHTML += "<div id=\"stb_cont"+i+"-content\" class=\"generic_content\"></div>";
        $("stb_cont"+i+"-headline").hide();
        $("stb_cont"+i+"-content").hide();
      }
    }

    this.var_onto.show();
  },

  isToolbarAvailable: function () {
    if (typeof wgHideSemanticToolbar !== 'undefined'
      && wgHideSemanticToolbar === true) {
      return false;
    }
    if ($("ontomenuanchor") != null) {
      this.var_onto = $("ontomenuanchor");
      return true;
    }
    return false;
  },
	
  isToolbarVisible: function () {
    if ($("ontomenuanchor") != null && $("ontomenuanchor").visible()) {
      return true;
    }
    return false;
  },
	
  initialize: function() {
    this.contarray = new Array();
    // tab array - how many tabs are there and which one is active?
    this.tabarray = new Array();
    this.tabnames = new Array(gLanguage.getMessage('STB_TOOLS'),
      gLanguage.getMessage('STB_LINKS'),
      gLanguage.getMessage('STB_FACTS'));
    this.closeCallbacks = [];
    this.closeButtonClickCallbacks = [];
		
    // An array of objects that implements a toolbox for the STB.
    if (!this.toolboxObjects) {
      this.toolboxObjects = [];
    }
  },

  /**
	 * Registers a toolbox in the STB.
	 * 
	 * @param {Object} or {Function} toolboxObject
	 * 		An object that implements a toolbox for the STB. It must have a
	 * 		method named 'initToolbox'.
	 * 		It can also be a function that is called for the initialization.
	 */
  registerToolbox: function (toolboxObject) {
    if (typeof toolboxObject === 'object') {
      if (typeof toolboxObject.initToolbox === 'undefined') {
        alert("Internal error:\n" +
          "The given toolbox object is missing the function 'initToolbox'.\n" +
          "See registerToolbox in STB_Framework.js");
      } else {
        this.toolboxObjects.push(toolboxObject);
      }
    } else if (typeof toolboxObject === 'function') {
      this.toolboxObjects.push(toolboxObject);
    } else {
      alert("Internal error:\n" +
        "The given toolbox object is neither a function nor an object.\n" +
        "See registerToolbox in STB_Framework.js");
    }
  },
	
  /**
	 * Creates the HTML of the title section of the toolbar
	 */
  createToolbarTitle : function () {
    var imgHiddenStyle = 'style="display:none"';

    var closeImg = '<img id="semtoolbarclosebtn"/>';
    var minimizeImg = '<img id="semtoolbarminimizebtn"/>';
    var maximizeImg = '<img id="semtoolbarmaximizebtn" ' + imgHiddenStyle + '/>';
		
    var html =
    '<div id="semtoolbartitle" class="semtoolbartitlemaxi">' +
    '<span>' + gLanguage.getMessage('STB_TITLE') + '</span>' +
    '<span id="semtoolbartitlebuttons">' + minimizeImg + maximizeImg + closeImg + '</span>' +
    '</div>';
			
    return html;
  },
	
  // create a new div container
  createDivContainer : function(contnum, tabnr) {
    // check if we need to add a new tab
    if (this.tabarray[tabnr] == null) {
      if (this.curtabShown == tabnr) {
        this.tabarray[tabnr] = 1;
      } else {
        this.tabarray[tabnr] = 0;
      }
      if (this.tabarray.length > 1) {
        this.createTabHeader();
      } else if(wgAction == "annotate") {
        this.frameworkForceHeader;
        this.createForcedHeader();
      }
    }
    this.contarray[contnum] = new DivContainer();
    this.contarray[contnum].createContainer(contnum, tabnr);

    if (contnum === HELPCONTAINER || (contnum === ASKQUERYCONTAINER && mw.config.get('wgCKeditorVisible'))) {
      this.contarray[contnum].setVisibility(0);
    } else {
      this.contarray[contnum].setVisibility(1);
    }

    // return newly created div container
    return this.contarray[contnum];
  },
	
	

  showSemanticToolbarContainer : function(container) {
    try {
      if (container) {
        // query container doesn't exist in WYSIWYG editor
        if (typeof this.contarray[container] == 'undefined')
          return;
        if (this.contarray[container].getTab() == this.curtabShown) {
          if (this.contarray[container].headline) {
            $("stb_cont" + container + "-headline").show();
            document.getElementById("stb_cont" + container + "-link").className = 'minusplus';
            $("stb_cont" + container + "-icon").src = wgScriptPath + STBIMGMINUS;
          }
          if (this.contarray[container].isVisible()) {
            $("stb_cont" + container + "-content").show();
            $("stb_cont" + container + "-icon").src = wgScriptPath + STBIMGMINUS;
          }
          else {
            $("stb_cont" + container + "-content").hide();
            document.getElementById("stb_cont" + container + "-link").className = 'plusminus';
            $("stb_cont" + container + "-icon").src = wgScriptPath + STBIMGPLUS;
          }
        }
      }
      else {
        for (var i = 0; i < this.contarray.length; i++) {
          if (this.contarray[i] && this.contarray[i].getTab() == this.curtabShown) {
            if (this.contarray[i].headline) {
              $("stb_cont" + i + "-headline").show();
              document.getElementById("stb_cont" + i + "-link").className = 'minusplus';
            }
            if (this.contarray[i].isVisible()) {
              $("stb_cont" + i + "-content").show();
            }
            else {
              $("stb_cont" + i + "-content").hide();
              document.getElementById("stb_cont" + i + "-link").className = 'plusminus';
            }
          }
        }
      }
    } catch (error) {
    }
  },

  // refresh content of container
  contentChanged : function(contnum) {
    if (this.isToolbarVisible()) {
      // probably show container
      this.showSemanticToolbarContainer(contnum);
      // probably resize toolbar
      this.resizeToolbar();
			
      // send show/hide container event
      if (typeof this.contarray[contnum] != 'undefined')
        this.contarray[contnum].showContainerEvent();
    }
  },

  notify : function(container) {
  },

  getDivContainer : function() {
  },

  createTabHeader : function() {
    // is there more than one tab?! -> display inactive containers
    var tabHeader = "";
    if (this.tabarray.length > 1) {
      for (var i = 0; i < (this.tabarray.length); i++)
      {
        if (this.curtabShown != i) {
        // inactive tab
        /* Tabs are currently disabled
					tabHeader += 
'<div id="expandable" ' +
      'style="cursor:pointer;cursor:hand;" ' +
      'onclick=stb_control.switchTab('+i+')>' +
      '<img src="' + wgScriptPath + '/extensions/SMWHalo/skins/plus.gif" ' +
           'onmouseover="(src=\'' + wgScriptPath + '/extensions/SMWHalo/skins/plus-act.gif\')" ' +
           'onmouseout="(src=\'' + wgScriptPath + '/extensions/SMWHalo/skins/plus.gif\')">' +
 '</div>' +
 '<div id="tab_'+i+'" ' +
//      'style="cursor:pointer;cursor:move;" ' +
//	  'onclick=stb_control.switchTab('+i+')' +
      '>'
      +this.tabnames[i]+
 '</div>';
 */
        } else {
          // active tab
          // Tabs are currently disabled
          //            	    var updateStr = '<div id="expandable"> ' +
          //									'</div><div id="tab_'+i+'" >'+this.tabnames[i]+'</div>';
          var updateStr = '<div id="expandable"> ' +
          '</div>';
          $("activetabcontainer").update(updateStr);
        }
      }
    }
    $("tabcontainer").update(tabHeader);
  },

  createForcedHeader : function() {
    // force to show a header - for use in annotation mode
    tabHeader = '<div id="expandable" ' +
    'style="cursor:pointer;cursor:hand;" ' +
    'onclick=stb_control.collapse()>' +
    '<img src="' + wgScriptPath + '/extensions/SMWHalo/skins/expandable.gif" ' +
    'onmouseover="(src=\'' + wgScriptPath + '/extensions/SMWHalo/skins/expandable-act.gif\')" ' +
    'onmouseout="(src=\'' + wgScriptPath + '/extension/SMWHalo/skins/expandable.gif\')">' +
    '</div>' +
    '<div id="tab_0" ' +
    'onclick=stb_control.collapse() ' +
    'style="cursor:pointer;cursor:hand;" ' +
    'style="cursor:pointer;cursor:hand;">' +
    gLanguage.getMessage('STB_ANNOTATION_HELP') +
    '</div>';
    $("tabcontainer").update(tabHeader);
  },

  switchTab: function(tabnr) {
    // hide current containers in current tab
    this.hideSemanticToolbarContainerTab(tabnr);

    // set current tab to clicked one
    this.tabarray[this.curtabShown] = 0;
    this.tabarray[tabnr] = 1;
    this.curtabShown = tabnr;
    // change tab header and show new containers in tab
    this.createTabHeader();
    // display all containers in current tab
    this.showSemanticToolbarContainer();
    this.resizeToolbar();
    this.setCookie(this.tabarray);
		
    // send tab change event
    this.contarray.each(function (c) {
      if (c) c.showTabEvent(tabnr);
    });
		
  //		if (smwhg_dragresizetoolbar != null) {
  //			smwhg_dragresizetoolbar.disableDragging();
  //			smwhg_dragresizetoolbar.enableDragging();
  //		}
  },

  /**
	 * Adds a function (or a piece of JavaScript code) that is executed when the
	 * toolbar is closed.
	 * 
	 * @param {Function} or {String} func
	 * 		A function or a string containing JavaScript
	 */
  onClose: function(func) {
    if (typeof func === 'function' || typeof func === 'string') {
      this.closeCallbacks.push(func);
    }
  },

  closeToolbar: function () {
    for (var i = 0, len = this.closeCallbacks.length; i < len; ++i) {
      var cb = this.closeCallbacks[i];
      if (typeof cb === 'string') {
        eval(cb);
      } else if (typeof cb === 'function') {
        cb();
      }
    }
    // Hide the toolbar
    if($('ontomenuanchor')) {
      $('ontomenuanchor').innerHTML = '';
      $('ontomenuanchor').hide();
    }
		
  },
	
  /**
	 * Adds a function (or a piece of JavaScript code) that is executed when the
	 * close button of the toolbar is clicked.
	 * 
	 * @param {Function} or {String} func
	 * 		A function or a string containing JavaScript
	 */
  onCloseButtonClick: function (func) {
    if (typeof func === 'function' || typeof func === 'string') {
      this.closeButtonClickCallbacks.push(func);
    }
  },
	
  closeButtonClick: function () {
    for (var i = 0, len = this.closeButtonClickCallbacks.length; i < len; ++i) {
      var cb = this.closeButtonClickCallbacks[i];
      if (typeof cb === 'string') {
        eval(cb);
      } else if (typeof cb === 'function') {
        cb();
      }
    }
  },
	
  minimizeToolbar: function () {
    $("tabcontainer").hide();
    $("activetabcontainer").hide();
    $("semtoolbar").hide();
    $("semtoolbarminimizebtn").hide();
    $("semtoolbarmaximizebtn").show();
    $("semtoolbartitle").addClassName('semtoolbartitlemini');
    $("semtoolbartitle").removeClassName('semtoolbartitlemaxi');
  },
	
  maximizeToolbar: function () {
    $("tabcontainer").show();
    $("activetabcontainer").show();
    $("semtoolbar").show();
    $("semtoolbarminimizebtn").show();
    $("semtoolbarmaximizebtn").hide();
    $("semtoolbartitle").addClassName('semtoolbartitlemaxi');
    $("semtoolbartitle").removeClassName('semtoolbartitlemini');
  },
	
  hideSemanticToolbarContainerTab : function(tabnr) {
    if (tabnr != null) {
      for(var i=0;i<this.contarray.length;i++) {
        if (this.contarray[i] && this.contarray[i].getTab() == this.curtabShown) {
          $("stb_cont"+i+"-headline").hide();
          $("stb_cont"+i+"-content").hide();
        }
      }
    }
  },
	
  setDragging: function( dragging ){
    this.dragging = dragging;
  },
	
  collapse: function() {
		
    if(this.dragging==true){
      return;
    }
    if (this.isCollapsed) {
      for(var i=0;i<this.contarray.length;i++) {
        if (this.contarray[i] && this.contarray[i].getTab() == this.curtabShown && i != SAVEANNOTATIONSCONTAINER) {
          $("stb_cont"+i+"-headline").show();
          $("stb_cont"+i+"-content").show();
          this.isCollapsed = false;
        }
      }
    } else {
      for(var i=0;i<this.contarray.length;i++) {
        if (this.contarray[i] && this.contarray[i].getTab() == this.curtabShown && i != SAVEANNOTATIONSCONTAINER) {
          $("stb_cont"+i+"-headline").hide();
          $("stb_cont"+i+"-content").hide();
          this.isCollapsed = true;
        }
      }
    }
  },

  resizeToolbar : function() {
    // max. usable height for toolbar
    var maxUsableHeight = this.getWindowHeight() - 150;
    if (maxUsableHeight > 150) {
      if ($('activetabcontainer')) {
        maxUsableHeight -= ($('tabcontainer').scrollHeight + 10 + $('activetabcontainer').scrollHeight);
      }
      // calculate height of containers:
      this.countNumOfDisplayedContainers();
      var neededHeight = this.calculateNeededHeightOfContainers();
      if (this.contarray[HELPCONTAINER] != null && this.contarray[HELPCONTAINER].isVisible()) {
        maxUsableHeight -= this.contarray[HELPCONTAINER].getNeededHeight();
      }

      if (neededHeight >= maxUsableHeight) {
        var j = this.numOfVisibleContainers;
        maxUsableHeight -= j*22;	// substract headers

        // only one container is there -> set to maxUsableHeight!
        if ((this.numOfContainers-1) == 0) {
          if (neededHeight > maxUsableHeight) {
            for(var i=0;i<this.contarray.length;i++) {
              if (this.contarray[i] && this.contarray[i].getTab() == this.curtabShown && this.contarray[i].getContainerNr() != HELPCONTAINER) {
                this.contarray[i].setContentStyle({
                  maxHeight: maxUsableHeight + 'px'
                });
              }
            }
          }
        // more containers are there!
        } else {
          for(var i=0;i<this.contarray.length;i++) {
            if (this.contarray[i] && this.contarray[i].getTab() == this.curtabShown && this.contarray[i].getContainerNr() != HELPCONTAINER && this.contarray[i].isVisible()) {
              if (this.contarray[i].getNeededHeight() < maxUsableHeight/this.numOfVisibleContainers) {
                this.contarray[i].setContentStyle({
                  maxHeight: this.contarray[i].getNeededHeight() + 'px'
                });
                maxUsableHeight -= this.contarray[i].getNeededHeight();
              } else {
                this.contarray[i].setContentStyle({
                  maxHeight: maxUsableHeight/(this.numOfVisibleContainers) + 'px'
                });
              }
            }
          }
        }
      // stb fits into available free space
      } else {
        for(var i=0;i<this.contarray.length;i++) {
          if (this.contarray[i] && this.contarray[i].getTab() == this.curtabShown && this.contarray[i].getContainerNr() != HELPCONTAINER) {
            this.contarray[i].setContentStyle({
              maxHeight: ''
            });
          }
        }
      }
    }
  },

  calculateNeededHeightOfContainers : function() {
    var j = 0;
    for(var i=0;i<this.contarray.length;i++) {
      if (this.contarray[i] && this.contarray[i].getTab() == this.curtabShown && this.contarray[i].isVisible()) {
        j += this.contarray[i].getNeededHeight();
      }
    }
    return j;
  },

  countNumOfDisplayedContainers : function () {
    var j = 0;
    var d = 0;
    if (this.contarray) {
      for(var i=0;i<this.contarray.length;i++) {
        if (this.contarray[i] && this.contarray[i].getTab() == this.curtabShown) {
          j++;
          if (this.contarray[i].isVisible()) {
            d++;
          }
        }
      }
    }
    this.numOfContainers = j;
    this.numOfVisibleContainers = d;
  },

  isVisible : function () {
    this.countNumOfDisplayedContainers()
    return this.numOfVisibleContainers;
  },

  getWindowHeight : function() {
    if (window.innerHeight) {
      return window.innerHeight;
    } else {
      //Common for IE
      if (window.document.documentElement && window.document.documentElement.clientHeight) {
        return typeof(window) == 'undefined' ? 0 : window.document.documentElement.clientHeight;
      } else {
        //Fallback solution for IE, does not always return usable values
        if (document.body && document.body.offsetHeight) {
          return typeof(win) == 'undefined' ? 0 : document.body.offsetHeight;
        }
        return 0;
      }
    }
  },

  getCookieTab : function() {
    var cookie = document.cookie;
    var length = cookie.length-1;
    if (cookie.charAt(length) != ";")
      cookie += ";";
    var a = cookie.split(";");

    // walk through cookies...
    for (var i=0; i<a.length; i++) {
      var cookiename = this.trim(a[i].substring(0, a[i].search('=')));
      var cookievalue = a[i].substring(a[i].search('=')+1,a[i].length);
      if (cookiename == "stbpreftab") {
        var cookievalue = cookievalue.split(",");
        var retval = new Array();
        for (var j =0; j<cookievalue.length;j++) {
          retval[j] = parseInt(cookievalue[j]);
        }
        this.cookiePrefTab = retval;
      } else if (cookiename == "stbprefhelp") {
        this.cookieHelpTab = parseInt(cookievalue);
      }
    }
  },

  trim : function(string) {
    return string.replace(/(^\s+|\s+$)/g, "");
  },

  setCookie : function(curtabpos) {

    var a = new Date();
    a = new Date(a.getTime() +1000*60*60*24*365);
    var implode = '';
    var first = true;
    for (var i=0; i<curtabpos.length; i++) {
      if (first == true)
        first = false;
      else
        implode += ",";
      implode += curtabpos[i];
    }

    document.cookie = 'stbpreftab='+implode+'; expires='+a.toGMTString()+';';
  },

  setHelpCookie : function(helpshown) {

    var a = new Date();
    a = new Date(a.getTime() +1000*60*60*24*365);

    document.cookie = 'stbprefhelp='+helpshown+'; expires='+a.toGMTString()+';';
  },

  addOntoMenuAnchor: function(){
    var ontomenuAnchor = $("ontomenuanchor");
    if (ontomenuAnchor == null) {
      var ontomenuAnchor = new Element('div', {
        'id' : 'ontomenuanchor'
      } )
      document.body.appendChild(ontomenuAnchor);
    }
    ontomenuAnchor.show();
  },
	
  /**
	 * Initializes the toolbar framework.
	 * - Creates the "OntomenuAnchor", i.e. a div in the DOM that contains the 
	 *   whole toolbar.
	 * - Creates the HTML skeleton that contains all toolboxes of the STB
	 * - Calls the init functions of all registered toolboxes.
	 * 
	 */
  initToolbarFramework: function () {
    this.stbconstructor();
    Event.observe(window, 'resize', this.resizeToolbar.bindAsEventListener(this));
    // The close button in not available in the wiki text mode
    if (!mw.config.get('wgCKeditorVisible')) {
      $('semtoolbarclosebtn').hide();
    }
    else {
      Event.observe('semtoolbarclosebtn', 'click',  this.closeButtonClick.bindAsEventListener(this));
    }
    Event.observe('semtoolbarminimizebtn', 'click',  this.minimizeToolbar.bindAsEventListener(this));
    Event.observe('semtoolbarmaximizebtn', 'click',  this.maximizeToolbar.bindAsEventListener(this));
		
    // Call the init functions of all registered toolboxes
    for (var i = 0, len = this.toolboxObjects.length; i < len; ++i) {
      var obj = this.toolboxObjects[i];
      if (typeof obj === 'object') {
        obj.initToolbox();
      } else if (typeof obj === 'function') {
        obj();
      }
    }
  }
}

window.stb_control = new ToolbarFramework();

jQuery(document).ready(function(){

  window.stb_control.initToolbarFramework();

  //enabling dragging makes STB visible, so do this only when WYSIWYG is off.
  //when WYSIWYG is on it will take care of STB visibility by it self
  if((mw.util.getParamValue('mode') !== 'wysiwyg')
    || (mw.user.options.get('cke_show') === 'wikitexteditor')
      || (mw.user.options.get('cke_show') === 'rememberlast' && mw.user.options.get('riched_use_toggle') && $.cookie('wgCKeditorToggleState') === 'hidden'))
  {
    window.smwhg_dragresizetoolbar && window.smwhg_dragresizetoolbar.callme();
  }
  
  
});

