/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/classnames/index.js":
/*!******************************************!*\
  !*** ./node_modules/classnames/index.js ***!
  \******************************************/
/***/ ((module, exports) => {

eval("var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!\n  Copyright (c) 2018 Jed Watson.\n  Licensed under the MIT License (MIT), see\n  http://jedwatson.github.io/classnames\n*/\n/* global define */\n\n(function () {\n\t'use strict';\n\n\tvar hasOwn = {}.hasOwnProperty;\n\n\tfunction classNames() {\n\t\tvar classes = [];\n\n\t\tfor (var i = 0; i < arguments.length; i++) {\n\t\t\tvar arg = arguments[i];\n\t\t\tif (!arg) continue;\n\n\t\t\tvar argType = typeof arg;\n\n\t\t\tif (argType === 'string' || argType === 'number') {\n\t\t\t\tclasses.push(arg);\n\t\t\t} else if (Array.isArray(arg)) {\n\t\t\t\tif (arg.length) {\n\t\t\t\t\tvar inner = classNames.apply(null, arg);\n\t\t\t\t\tif (inner) {\n\t\t\t\t\t\tclasses.push(inner);\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t} else if (argType === 'object') {\n\t\t\t\tif (arg.toString === Object.prototype.toString) {\n\t\t\t\t\tfor (var key in arg) {\n\t\t\t\t\t\tif (hasOwn.call(arg, key) && arg[key]) {\n\t\t\t\t\t\t\tclasses.push(key);\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t} else {\n\t\t\t\t\tclasses.push(arg.toString());\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\n\t\treturn classes.join(' ');\n\t}\n\n\tif ( true && module.exports) {\n\t\tclassNames.default = classNames;\n\t\tmodule.exports = classNames;\n\t} else if (true) {\n\t\t// register as 'classnames', consistent with npm package name\n\t\t!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function () {\n\t\t\treturn classNames;\n\t\t}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),\n\t\t__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));\n\t} else {}\n}());\n\n\n//# sourceURL=webpack://d5i-modal-dev-state-monitor/./node_modules/classnames/index.js?");

/***/ }),

/***/ "./src/components/modal/styles.scss":
/*!******************************************!*\
  !*** ./src/components/modal/styles.scss ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n// extracted by mini-css-extract-plugin\n\n\n//# sourceURL=webpack://d5i-modal-dev-state-monitor/./src/components/modal/styles.scss?");

/***/ }),

/***/ "./src/components/modal/component.tsx":
/*!********************************************!*\
  !*** ./src/components/modal/component.tsx ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"DevStateMonitor\": () => (/* binding */ DevStateMonitor)\n/* harmony export */ });\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lodash */ \"lodash\");\n/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! classnames */ \"./node_modules/classnames/index.js\");\n/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ \"@wordpress/i18n\");\n/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _divi_modal__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @divi/modal */ \"@divi/modal\");\n/* harmony import */ var _divi_modal__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_divi_modal__WEBPACK_IMPORTED_MODULE_4__);\n/* harmony import */ var _divi_object_renderer__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @divi/object-renderer */ \"@divi/object-renderer\");\n/* harmony import */ var _divi_object_renderer__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_divi_object_renderer__WEBPACK_IMPORTED_MODULE_5__);\n/* harmony import */ var _divi_error_boundary__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @divi/error-boundary */ \"@divi/error-boundary\");\n/* harmony import */ var _divi_error_boundary__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_divi_error_boundary__WEBPACK_IMPORTED_MODULE_6__);\n/* harmony import */ var _styles_scss__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./styles.scss */ \"./src/components/modal/styles.scss\");\n// External dependencies.\n\n\n\n// WordPress dependencies\n\n// Internal dependencies.\n\n\n\n\nvar ScriptList = function (_a) {\n    var scripts = _a.scripts;\n    var scriptList = [];\n    (0,lodash__WEBPACK_IMPORTED_MODULE_1__.forEach)(scripts, function (scriptItems, scriptName) {\n        scriptList.push((react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { key: \"state-monitor-script-\".concat(scriptName), className: \"et-vb-dev-state-monitor-script\" },\n            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"h2\", { className: \"et-vb-dev-state-monitor-script-heading\" }, scriptName),\n            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_divi_object_renderer__WEBPACK_IMPORTED_MODULE_5__.ObjectRenderer, { values: scriptItems }))));\n    });\n    return scriptList;\n};\nvar DevStateMonitor = function (props) {\n    var name = props.name, modules = props.modules, globalModules = props.globalModules, hoveredModule = props.hoveredModule, selectedModules = props.selectedModules, draggedModules = props.draggedModules, rightClickedModuleId = props.rightClickedModuleId, lastModuleClipboard = props.lastModuleClipboard, pressedKeys = props.pressedKeys, currentShortcut = props.currentShortcut, activeModalSetting = props.activeModalSetting, expandedModuleIds = props.expandedModuleIds, setExpandedModuleIds = props.setExpandedModuleIds, attributeState = props.attributeState, breakpoint = props.breakpoint, view = props.view, tab = props.tab, scripts = props.scripts;\n    // State badge component.\n    var StateBadge = function (active, slug, label) {\n        if (label === void 0) { label = ''; }\n        return (!active ? null : (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"span\", { className: \"et-devtool-state-monitor-module--state-\".concat(slug) },\n            slug,\n            label)));\n    };\n    // Recursive module list component.\n    var Module = function (_a) {\n        var _b, _c;\n        var module = _a.module;\n        // Hover state.\n        var isHovered = (0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(hoveredModule, 'id') === module.id;\n        var stateHovered = StateBadge(isHovered, 'hovered');\n        // Selected state.\n        var isSelected = (0,lodash__WEBPACK_IMPORTED_MODULE_1__.includes)(selectedModules, module.id);\n        var stateSelected = StateBadge(isSelected, 'selected');\n        // Dragged state\n        var isDragged = (0,lodash__WEBPACK_IMPORTED_MODULE_1__.includes)(draggedModules, module.id);\n        var stateDragged = StateBadge(isDragged, 'dragged');\n        // Right click state.\n        var isRightClicked = rightClickedModuleId === module.id;\n        var stateRightClicked = StateBadge(isRightClicked, 'right-clicked');\n        // Cliboard state\n        var isOnClipboard = (0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(lastModuleClipboard, ['id']) === module.id;\n        var stateOnClipboard = StateBadge(isOnClipboard, 'on-clipboard');\n        // Edited state\n        var isEdited = module.id === activeModalSetting;\n        var stateEdited = StateBadge(isEdited, 'edited');\n        // Global module state.\n        var globalId = (_c = (_b = module === null || module === void 0 ? void 0 : module.props) === null || _b === void 0 ? void 0 : _b.attrs) === null || _c === void 0 ? void 0 : _c.globalModule;\n        var isGlobal = (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isString)(globalId) && '' !== globalId;\n        var stateGlobal = StateBadge(isGlobal, 'global', \"- \".concat(globalId));\n        // Props monitor\n        var isPropsExpanded = (0,lodash__WEBPACK_IMPORTED_MODULE_1__.includes)(expandedModuleIds, module.id);\n        var propsMonitor = !isPropsExpanded\n            ? null\n            : (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: \"et-devtool-state-monitor-module-props\" },\n                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_divi_object_renderer__WEBPACK_IMPORTED_MODULE_5__.ObjectRenderer, { values: module })));\n        return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: classnames__WEBPACK_IMPORTED_MODULE_2___default()({\n                'et-devtool-state-monitor-module': true,\n                'et-devtool-state-monitor-module--hovered': isHovered,\n                'et-devtool-state-monitor-module--selected': isSelected,\n                'et-devtool-state-monitor-module--dragged': isDragged,\n                'et-devtool-state-monitor-module--right-clicked': isRightClicked,\n                'et-devtool-state-monitor-module--on-clipboard': isOnClipboard,\n                'et-devtool-state-monitor-module--edited': isEdited,\n            }) },\n            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: \"et-devtool-state-monitor-module-meta\" },\n                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"span\", { className: \"et-devtool-state-monitor-module--name\" }, module.name),\n                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"span\", { className: \"et-devtool-state-monitor-module--id\", role: \"button\", tabIndex: 0, onKeyPress: lodash__WEBPACK_IMPORTED_MODULE_1__.noop, onClick: function () {\n                        var updatedExpandedModuleIds = isPropsExpanded\n                            ? (0,lodash__WEBPACK_IMPORTED_MODULE_1__.without)(expandedModuleIds, module.id)\n                            : [].concat(expandedModuleIds).concat(module.id);\n                        setExpandedModuleIds(updatedExpandedModuleIds);\n                    } }, module.id),\n                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: \"et-devtool-state-monitor-module-state\" },\n                    stateGlobal,\n                    stateSelected,\n                    stateDragged,\n                    stateRightClicked,\n                    stateOnClipboard,\n                    stateEdited,\n                    stateHovered)),\n            propsMonitor,\n            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: \"et-devtool-state-monitor-module--children\" }, ((0,lodash__WEBPACK_IMPORTED_MODULE_1__.isEmpty)(module.children) ? null : module.children.map(function (childId) { return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(Module, { key: \"et-devtool-module-\".concat(childId), module: modules[childId] })); })))));\n    };\n    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_divi_error_boundary__WEBPACK_IMPORTED_MODULE_6__.ErrorBoundary, { key: \"et-vb-divi-modals--dev-state-monitor\", componentName: \"et-vb-divi-modals--dev-state-monitor\" },\n        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_divi_modal__WEBPACK_IMPORTED_MODULE_4__.WrapperContainer, { draggable: true, resizable: true, expandable: true, snappable: true, modalName: name, modalActiveTab: tab ? tab : 'layout', multiPanels: true },\n            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_divi_modal__WEBPACK_IMPORTED_MODULE_4__.Header, { name: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('State Monitor', 'et_builder') }),\n            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_divi_modal__WEBPACK_IMPORTED_MODULE_4__.BodyPanelWrapperContainer, null,\n                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_divi_modal__WEBPACK_IMPORTED_MODULE_4__.PanelContainer, { id: \"layout\", label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Layout', 'et_builder') },\n                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { style: {\n                            padding: '20px 20px 40px 20px',\n                        } },\n                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(Module, { module: modules.root }),\n                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: classnames__WEBPACK_IMPORTED_MODULE_2___default()({\n                                'et-devtool-state-monitor-overview': true,\n                            }) },\n                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: \"et-devtool-state-monitor-overview-view\" },\n                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"h3\", null, \"View\"),\n                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: \"et-devtool-state-monitor-overview-value\" }, view)),\n                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: \"et-devtool-state-monitor-overview-breakpoint\" },\n                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"h3\", null, \"Breakpoint\"),\n                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: \"et-devtool-state-monitor-overview-value\" }, breakpoint)),\n                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: \"et-devtool-state-monitor-overview-attribute-state\" },\n                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"h3\", null, \"Attribute State\"),\n                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: \"et-devtool-state-monitor-overview-value\" }, attributeState)),\n                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: \"et-devtool-state-monitor-overview-selected\" },\n                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"h3\", null, \"Selected\"),\n                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: \"et-devtool-state-monitor-overview-value\" },\n                                    selectedModules.length,\n                                    selectedModules.length > 1 ? ' Modules' : ' Module')),\n                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: \"et-devtool-state-monitor-overview-keypress\" },\n                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"h3\", null, \"Keypress\"),\n                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: \"et-devtool-state-monitor-overview-value\" }, (0,lodash__WEBPACK_IMPORTED_MODULE_1__.map)(pressedKeys, function (key) { return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"kbd\", { key: \"et-devtool-state-monitor-overview-key-\".concat(key) }, key)); }))),\n                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: \"et-devtool-state-monitor-overview-shortcut\" },\n                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"h3\", null, \"Shortcuts\"),\n                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { className: \"et-devtool-state-monitor-overview-value\" },\n                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"pre\", null, currentShortcut.name)))))),\n                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_divi_modal__WEBPACK_IMPORTED_MODULE_4__.PanelContainer, { id: \"scripts\", label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Scripts', 'et_builder') },\n                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { style: {\n                            padding: '20px 20px 40px 20px',\n                        } },\n                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(ScriptList, { scripts: scripts }))),\n                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_divi_modal__WEBPACK_IMPORTED_MODULE_4__.PanelContainer, { id: \"global-modules\", label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Global Modules', 'et_builder') },\n                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { style: {\n                            padding: '20px 20px 40px 20px',\n                        } }, globalModules.map(function (globalModule) {\n                        var _a;\n                        return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", { key: \"global-module-item-\".concat(globalModule.id), className: \"et-devtool-state-monitor-global-module-item\" },\n                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"h3\", null,\n                                \"id: \",\n                                globalModule.id),\n                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(Module, { module: (_a = globalModule === null || globalModule === void 0 ? void 0 : globalModule.content) === null || _a === void 0 ? void 0 : _a.root })));\n                    })))))));\n};\n\n\n\n//# sourceURL=webpack://d5i-modal-dev-state-monitor/./src/components/modal/component.tsx?");

/***/ }),

/***/ "./src/components/modal/container.ts":
/*!*******************************************!*\
  !*** ./src/components/modal/container.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"name\": () => (/* binding */ name),\n/* harmony export */   \"type\": () => (/* binding */ type),\n/* harmony export */   \"DevStateMonitorContainer\": () => (/* binding */ DevStateMonitorContainer)\n/* harmony export */ });\n/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ \"lodash\");\n/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _divi_data__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @divi/data */ \"@divi/data\");\n/* harmony import */ var _divi_data__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_divi_data__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./component */ \"./src/components/modal/component.tsx\");\nvar __assign = (undefined && undefined.__assign) || function () {\n    __assign = Object.assign || function(t) {\n        for (var s, i = 1, n = arguments.length; i < n; i++) {\n            s = arguments[i];\n            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))\n                t[p] = s[p];\n        }\n        return t;\n    };\n    return __assign.apply(this, arguments);\n};\n\n// Internal dependencies\n\n// Local dependencies.\n\nvar name = 'divi/dev-state-monitor';\nvar type = 'multi';\nvar DevStateMonitorContainer = (0,_divi_data__WEBPACK_IMPORTED_MODULE_1__.withSelect)(function (selectStore) {\n    var editPostStoreSelectors = selectStore('divi/edit-post');\n    var eventsStoreSelectors = selectStore('divi/events');\n    var rightClickOptionsSelectors = selectStore('divi/right-click-options');\n    var modalSelectors = selectStore('divi/modal-library');\n    var moduleSelectors = selectStore('divi/module');\n    // Modal state.\n    var modalState = modalSelectors.getActiveModal(type);\n    // Expanded module ids\n    var expandedModuleIds = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.get)(modalState, [name, 'attributes', 'expandedModuleIds']);\n    // Module modal state.\n    var singleModalState = modalSelectors.getActiveModal('single');\n    // Module ids.\n    var getModuleIds = function (modules) { return (0,lodash__WEBPACK_IMPORTED_MODULE_0__.map)(modules, function (module) { return module.id; }); };\n    // Right clicks.\n    var rightClick = rightClickOptionsSelectors.getState();\n    var rightClickedModuleId = rightClick.active\n        ? (0,lodash__WEBPACK_IMPORTED_MODULE_0__.get)(rightClick, ['owner', 'id'])\n        : '';\n    // Modules.\n    var modules = editPostStoreSelectors.getContent();\n    // Get global module ids. Get global module id based on content module's.\n    // Automatically remove duplicate id found.\n    var globalModuleIds = Array.from(new Set(Object\n        .entries(modules)\n        .filter(function (module) {\n        var _a, _b, _c;\n        var globalModule = (_c = (_b = (_a = module[1]) === null || _a === void 0 ? void 0 : _a.props) === null || _b === void 0 ? void 0 : _b.attrs) === null || _c === void 0 ? void 0 : _c.globalModule;\n        return 'string' === typeof globalModule && '' !== globalModule;\n    })\n        .map(function (module) { var _a, _b, _c; return (_c = (_b = (_a = module[1]) === null || _a === void 0 ? void 0 : _a.props) === null || _b === void 0 ? void 0 : _b.attrs) === null || _c === void 0 ? void 0 : _c.globalModule; })));\n    var globalModules = globalModuleIds.map(function (id) {\n        var globalModule = selectStore('divi/global-layouts').getLayout(id);\n        return __assign({ id: id }, globalModule);\n    });\n    return {\n        modules: modules,\n        globalModules: globalModules,\n        scripts: moduleSelectors.getScripts(),\n        hoveredModule: eventsStoreSelectors.getHoveredModule(),\n        selectedModules: getModuleIds(eventsStoreSelectors.getSelectedModules(false)),\n        draggedModules: getModuleIds(eventsStoreSelectors.getDraggedModules().asMutable({ deep: true })),\n        pressedKeys: selectStore('divi/keyboard-shortcuts').getPressedKeys(),\n        currentShortcut: selectStore('divi/keyboard-shortcuts').getCurrentShortcut(),\n        // App View.\n        view: selectStore('divi/app-ui').getView(),\n        breakpoint: selectStore('divi/app-ui').getBreakpoint(),\n        attributeState: selectStore('divi/app-ui').getAttributeState(),\n        // Module Settings.\n        activeModalSetting: 'divi/module' === singleModalState.name && singleModalState.owner,\n        // Expanded module prop ids.\n        expandedModuleIds: expandedModuleIds,\n        setExpandedModuleIds: function (moduleIds) {\n            (0,_divi_data__WEBPACK_IMPORTED_MODULE_1__.dispatch)('divi/modal-library').setAttributes({\n                name: 'divi/dev-state-monitor',\n                attributes: {\n                    expandedModuleIds: moduleIds,\n                },\n            });\n        },\n        // @todo (D5) to be updated once new selector has been made.\n        lastModuleClipboard: {},\n        rightClickedModuleId: rightClickedModuleId,\n    };\n})(_component__WEBPACK_IMPORTED_MODULE_2__.DevStateMonitor);\n\n\n//# sourceURL=webpack://d5i-modal-dev-state-monitor/./src/components/modal/container.ts?");

/***/ }),

/***/ "./src/components/modal/index.ts":
/*!***************************************!*\
  !*** ./src/components/modal/index.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"DevStateMonitor\": () => (/* reexport safe */ _component__WEBPACK_IMPORTED_MODULE_0__.DevStateMonitor),\n/* harmony export */   \"DevStateMonitorContainer\": () => (/* reexport safe */ _container__WEBPACK_IMPORTED_MODULE_1__.DevStateMonitorContainer),\n/* harmony export */   \"name\": () => (/* reexport safe */ _container__WEBPACK_IMPORTED_MODULE_1__.name),\n/* harmony export */   \"type\": () => (/* reexport safe */ _container__WEBPACK_IMPORTED_MODULE_1__.type),\n/* harmony export */   \"component\": () => (/* binding */ component)\n/* harmony export */ });\n/* harmony import */ var _component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./component */ \"./src/components/modal/component.tsx\");\n/* harmony import */ var _container__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./container */ \"./src/components/modal/container.ts\");\n\n\nvar component = _container__WEBPACK_IMPORTED_MODULE_1__.DevStateMonitorContainer;\n\n\n\n//# sourceURL=webpack://d5i-modal-dev-state-monitor/./src/components/modal/index.ts?");

/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _divi_data__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @divi/data */ \"@divi/data\");\n/* harmony import */ var _divi_data__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_divi_data__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _components_modal__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./components/modal */ \"./src/components/modal/index.ts\");\n// Divi dependencies\n\n// Local dependencies\n\n// Open divi/dev-state-monitor, a registered modal, when state-monitor menu item on admin bar is clicked.\n// This ensure that the following function is registered on app window.\n// @todo this top / window detection should be abstracted into util function.\nif (window.top !== window) {\n    // Listen to click event on top window's admin bar item. The condition above ensures that the\n    // following is only executed in app window.\n    window.top.jQuery('#wp-admin-bar-d5-modal-dev-state-monitor a').on('click', function (event) {\n        event.preventDefault();\n        // Open registered modal, divi/dev-clipboard.\n        (0,_divi_data__WEBPACK_IMPORTED_MODULE_0__.dispatch)('divi/modal-library').open({ name: _components_modal__WEBPACK_IMPORTED_MODULE_1__.name });\n    });\n    // On script load, register `divi/clipboard` modal to modals registry.\n    (0,_divi_data__WEBPACK_IMPORTED_MODULE_0__.dispatch)('divi/modal-library').addModal({\n        name: _components_modal__WEBPACK_IMPORTED_MODULE_1__.name,\n        type: _components_modal__WEBPACK_IMPORTED_MODULE_1__.type,\n        component: _components_modal__WEBPACK_IMPORTED_MODULE_1__.DevStateMonitorContainer,\n    });\n}\n\n\n//# sourceURL=webpack://d5i-modal-dev-state-monitor/./src/index.ts?");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "React" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = React;

/***/ }),

/***/ "lodash":
/*!*************************!*\
  !*** external "lodash" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = lodash;

/***/ }),

/***/ "@divi/data":
/*!********************************!*\
  !*** external ["divi","data"] ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = divi.data;

/***/ }),

/***/ "@divi/error-boundary":
/*!*****************************************!*\
  !*** external ["divi","errorBoundary"] ***!
  \*****************************************/
/***/ ((module) => {

"use strict";
module.exports = divi.errorBoundary;

/***/ }),

/***/ "@divi/modal":
/*!*********************************!*\
  !*** external ["divi","modal"] ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = divi.modal;

/***/ }),

/***/ "@divi/object-renderer":
/*!******************************************!*\
  !*** external ["divi","objectRenderer"] ***!
  \******************************************/
/***/ ((module) => {

"use strict";
module.exports = divi.objectRenderer;

/***/ }),

/***/ "@wordpress/i18n":
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = wp.i18n;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	
/******/ })()
;