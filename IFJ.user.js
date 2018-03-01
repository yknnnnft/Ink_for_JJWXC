// ==UserScript==
// @name        INK_FOR_JJWXC
// @namespace   ifj.tryclear
// @include     http://bbs.jjwxc.net/showmsg.php*
// @include     http://bbs.jjwxc.com/showmsg.php*
// @exclude     http://bbs.jjwxc.net/showmsg.php?board=36*
// @exclude     http://bbs.jjwxc.com/showmsg.php?board=36*
// @version     1.1.2
// @grant       GM_addStyle
// @updateURL   https://openuserjs.org/meta/yknnnnft/INK_FOR_JJWXC.meta.js
// ==/UserScript==

(function() {
	    'use strict';

	var RESTRICTION = {
		'CUSTOMHEIGHT' : 0,
		'CHAR' : 0,
		'LINEBREAK' : 0,
		'PROHIBIT_WORD' : [],
		'BGCOLOR' : '#EEFAEE',
        'HIDE_ADS' : false
	};
	var ALERT_MSG = {
		OVERALL : '该回复被隐藏',
		HEIGHT : 'OVER HEIGHT',
		CHAR : 'TOO MANY CHARS',
		LINEBREAK : 'TO MANY LINE BREAKS'
	};
	var SELECTOR = {
		REPLY_TRS : 'tr[class^="reply_"]',
		REPLY_TOPIC : '#topic',
		DIV : 'div'
	};
	var CONSTANTS = {
		ORDER_NUMBER_OF_ICON : 0,
		ORDER_NUMBER_OF_TOPIC : 1,
		ORDER_NUMBER_OF_AUTHOR : 2,
		ORDER_NUMBER_OF_SEPARATOR : 3,
		CHAR_POINT : '.',
		CHAR_COMMA : ',',
		LOCAL_STORAGE_ITEMID : 'INK_FOR_JJWXC_RESTRICTION',
		SETTING_ICON_TEXT : 'IFJ',
		NUMBER_SETTING_CLASS : 'iptInkRestrNumber',
		TEXT_SETTING_CLASS : 'iptInkRestrText',
        INLINE_INPUT_CLASS : 'iptInkInlineInput',
		BTN_SETTING_CLASS : 'btnInkRestr',
		BTNHIDE_TEXT : '隐藏',
		LABEL_HEIGHT_TEXT : '高度(0:关闭)',
		LABEL_CHAR_TEXT : '字数(0:关闭)',
		LABEL_LB_TEXT : '换行(0:关闭)',
		LABEL_KEYWORD_TEXT : '关键字(以半角“,”分隔)',
		LABEL_BGCOLOR_TEXT : '背景色',
        LABEL_HIDE_ADS : '隐藏广告',
		CONFIRM_BUTTON_TEXT : '确认',
		CANCEL_BUTTON_TEXT : '取消'
	};
	initialRestrictionSettings();
	var CSSSTRING = '.repalceTd { background-color: ' + RESTRICTION.BGCOLOR + '; opacity: 0.6; cursor: pointer; } ' +
					  '.spanHideBtn { vertical-align: top; text-decoration: underline; float: right; cursor: pointer; }' +
					  '#divInkRestrIcon { position: fixed; width: 40px; height: 40px; background-color: RGB(238, 250, 238); ' +
					  'top: 20px; left: 20px; border-radius: 4px; opacity: 0.4; padding: 5px; cursor: pointer; ' +
					  '-moz-user-select: none; -webkit-user-select:none; ' +
					  'font-style: oblique; font-size: 15px; font-weight: bolder; line-height: 40px; text-align: center; } '+
					  '#divInkRestrIcon:hover { opacity: 1.0 } ' +
					  '#divInkRestrPanel { position: fixed; background: RGB(238, 250, 238); ' +
					  'top: 80px; left: 20px; padding: 3px; border-radius: 3px; opacity: 0.8; font-size: 12px; } ' +
					  '#divInkRestrPanel input { display: block; margin: 2px} ' +
                      '#divInkRestrPanel input.' + CONSTANTS.INLINE_INPUT_CLASS + ' { display: inline-block; margin: 2px }' +
					  '.btnInkRestr { margin: 10px } ' +
					  '.iptInkRestrNumber { ime-mode: disabled; } ';
	GM_addStyle(CSSSTRING);
	makeSettingPanel();
	var classIdOfReplies = new Set();
	initialSetOfReplies();
	classIdOfReplies.forEach(function(val, key, self) {
		var $trs = $(CONSTANTS.CHAR_POINT + val);
		initialHideBtn($trs);
        if (RESTRICTION.HIDE_ADS) {
            hideAds($trs);
        }
		if (checkMain($trs)) {
			replaceContent($trs);
		}
	});
	function $(selector, ele) {
		var element = ele || document;
		try {
			var matches = element.querySelectorAll(selector);
			return matches;
		}
		catch(e) {
			return null;
		}
	}
    function hideAds(tr) {
        var spanIcon = tr[CONSTANTS.ORDER_NUMBER_OF_ICON];
        var $spanAds = $('.textbook', spanIcon);
        $spanAds[0].setAttribute('hidden', '');
    }
	function checkMain(trs) {
		var $topic = $(SELECTOR.REPLY_TOPIC, trs[CONSTANTS.ORDER_NUMBER_OF_TOPIC])[0];
		if ($topic === undefined) {
			return false;
		}
		return _checkHeight($topic) || _checkTextLength($topic) || _checkLinebreak($topic) || _checkProhibitedWord($topic);
		function _checkHeight(topic) {
			if (RESTRICTION.CUSTOMHEIGHT === 0) {
				return false;
			}
			return topic.clientHeight >= RESTRICTION.CUSTOMHEIGHT;
		}
		function _checkTextLength(topic) {
			if (RESTRICTION.CHAR === 0) {
				return false;
			}
			return topic.innerText.length >= RESTRICTION.CHAR;
		}
		function _checkLinebreak(topic) {
			var arrLb = topic.innerText.match(/[\r|\n]/g);
			if (arrLb === null || RESTRICTION.LINEBREAK === 0) {
				return false;
			}
			return arrLb.length >= RESTRICTION.LINEBREAK;
		}
		function _checkProhibitedWord(topic) {
			if (RESTRICTION.PROHIBIT_WORD.length === 0) {
				return false;
			}
			return RESTRICTION.PROHIBIT_WORD.filter((val, i, self) => topic.innerText.includes(val)).length > 0;
		}
	}
	function initialHideBtn(trs) {
		var $trs = trs;
		var tdIcon = trs[CONSTANTS.ORDER_NUMBER_OF_ICON];
		var spanHide = document.createElement('span');
		var divIcon = $(SELECTOR.DIV, tdIcon)[0];
		spanHide.setAttribute('class', 'spanHideBtn');
		spanHide.innerText = CONSTANTS.BTNHIDE_TEXT;
		spanHide.addEventListener('click', function() {
			replaceContent($trs);
		});
		tdIcon.insertBefore(spanHide, null);
		divIcon.parentElement.insertBefore(spanHide, null);
	}
	function replaceContent(trs) {
		var tdIcon = trs[CONSTANTS.ORDER_NUMBER_OF_ICON], 
			tdReply = trs[CONSTANTS.ORDER_NUMBER_OF_TOPIC], 
			tdAuthor = trs[CONSTANTS.ORDER_NUMBER_OF_AUTHOR], 
			tdSeparator = trs[CONSTANTS.ORDER_NUMBER_OF_SEPARATOR];
		var tdReplace = document.createElement('td');
		var arrToReplace = [ tdIcon, tdReply, tdAuthor ];
		tdReplace.innerText = ALERT_MSG.OVERALL;
		tdReplace.setAttribute('class', 'repalceTd');
		tdReplace.addEventListener('click', makeReplacedBack(arrToReplace));
		var parentEle = tdSeparator.parentElement;
		parentEle.insertBefore(tdReplace, tdSeparator);
		[ tdIcon, tdReply, tdAuthor ].forEach(td => { td.setAttribute('hidden', 'true'); });
	}
	function initialRestrictionSettings() {
		var sRestriction = localStorage.getItem(CONSTANTS.LOCAL_STORAGE_ITEMID);
		var objRestriction;
		try {
			objRestriction = JSON.parse(sRestriction);
			console.log(objRestriction);
			if (objRestriction === null) {
				throw 'not correctly defined Restrictions';
			}
			for (let item in RESTRICTION) {
				if (objRestriction.hasOwnProperty(item) ) {
					RESTRICTION[item] = objRestriction[item];
				}
			}
		}
		catch(e) {
			console.log(e);
		}
		localStorage.setItem(CONSTANTS.LOCAL_STORAGE_ITEMID, JSON.stringify(RESTRICTION));
		return;
	}
	function initialSetOfReplies() {
		var $trOfReplies = $(SELECTOR.REPLY_TRS);
		for (let i = 0, l = $trOfReplies.length; i < l; i++) {
			let $tr = $trOfReplies[i];
			classIdOfReplies.add($tr.getAttribute('class'));
		}
		return;
	}
	function makeReplacedBack(arrTd) {
		return function() {
			this.remove();
			arrTd.forEach(td => { td.removeAttribute('hidden'); });
		};
	}
	function makeSettingPanel() {
		var divSettingIcon = document.createElement('div');
		divSettingIcon.setAttribute('id', 'divInkRestrIcon');
		divSettingIcon.innerText = CONSTANTS.SETTING_ICON_TEXT;
		document.body.appendChild(divSettingIcon);

		var divSettingPanel = document.createElement('div');
		divSettingPanel.setAttribute('id', 'divInkRestrPanel');
		divSettingPanel.setAttribute('hidden', 'true');
		document.body.appendChild(divSettingPanel);
		var iptHeight = _makeInputSet(CONSTANTS.LABEL_HEIGHT_TEXT, CONSTANTS.NUMBER_SETTING_CLASS);
		var iptChar = _makeInputSet(CONSTANTS.LABEL_CHAR_TEXT, CONSTANTS.NUMBER_SETTING_CLASS);
		var iptLineBreak = _makeInputSet(CONSTANTS.LABEL_LB_TEXT, CONSTANTS.NUMBER_SETTING_CLASS);
		var iptProhibtedWord = _makeInputSet(CONSTANTS.LABEL_KEYWORD_TEXT, CONSTANTS.TEXT_SETTING_CLASS);
		var iptBGColor = _makeInputSet(CONSTANTS.LABEL_BGCOLOR_TEXT, CONSTANTS.INLINE_INPUT_CLASS);
        var iptHideAds = _makeInputSet(CONSTANTS.LABEL_HIDE_ADS, CONSTANTS.INLINE_INPUT_CLASS);
        iptHideAds.setAttribute('type', 'checkbox');
        // var iptHideAds = document.createElement('input');
        // iptHideAds.setAttribute('type', 'checkbox');
        // iptHideAds.setAttribute('class', 'CONSTANTS.TEXT_SETTING_CLASS');
		iptHeight.value = RESTRICTION.CUSTOMHEIGHT;
		iptChar.value = RESTRICTION.CHAR;
		iptLineBreak.value = RESTRICTION.LINEBREAK;
		iptProhibtedWord.value = RESTRICTION.PROHIBIT_WORD.join(CONSTANTS.CHAR_COMMA);
		iptBGColor.setAttribute('type', 'color');
		iptBGColor.value = RESTRICTION.BGCOLOR;
        iptHideAds.checked = RESTRICTION.HIDE_ADS;


		var btnConfirm = document.createElement('button');
		btnConfirm.setAttribute('type', 'button');
		btnConfirm.setAttribute('class', CONSTANTS.BTN_SETTING_CLASS);
		btnConfirm.innerText = CONSTANTS.CONFIRM_BUTTON_TEXT;
		divSettingPanel.appendChild(btnConfirm);
		var btnCancel = document.createElement('button');
		btnCancel.setAttribute('type', 'button');
		btnCancel.setAttribute('class', CONSTANTS.BTN_SETTING_CLASS);
		btnCancel.innerText = CONSTANTS.CANCEL_BUTTON_TEXT;
		divSettingPanel.appendChild(btnCancel);
		btnConfirm.addEventListener('click', function() {
			divSettingPanel.setAttribute('hidden', 'true');
			var objRestr = {};
			objRestr.CUSTOMHEIGHT = parseInt(iptHeight.value) || 0;
			objRestr.CHAR = parseInt(iptChar.value) || 0;
			objRestr.LINEBREAK = parseInt(iptLineBreak.value) || 0;
			objRestr.PROHIBIT_WORD = iptProhibtedWord.value === '' ? [] : iptProhibtedWord.value.split(CONSTANTS.CHAR_COMMA);
            objRestr.HIDE_ADS = iptHideAds.checked;
			objRestr.BGCOLOR = iptBGColor.value || '#EEFAEE';
			localStorage.setItem(CONSTANTS.LOCAL_STORAGE_ITEMID, JSON.stringify(objRestr));
			document.location.reload();
		});
		btnCancel.addEventListener('click', function() {
			divSettingPanel.setAttribute('hidden', 'true');
		});
		divSettingIcon.addEventListener('click', function() {
			if (divSettingPanel.hasAttribute('hidden')) {
				divSettingPanel.removeAttribute('hidden');
			}
			else {
				divSettingPanel.setAttribute('hidden', 'true');
			}
		});
		function _makeInputSet(lblText, iptClassName) {
			var pInputSet = document.createElement('p');
			var lbl = document.createElement('label');
			lbl.innerText = lblText;
			var ipt = document.createElement('input');
			ipt.setAttribute('class', iptClassName);
			ipt.setAttribute('type', 'text');
			pInputSet.appendChild(lbl);
			pInputSet.appendChild(ipt);
			divSettingPanel.appendChild(pInputSet);
			return ipt;
		}
	}
})();
