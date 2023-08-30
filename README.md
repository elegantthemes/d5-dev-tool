# Divi 5 Dev Tool

URL: https://github.com/elegantthemes/d5-dev-tool

## Description
A Divi 5 extension with various tools for developers. It consists of a custom modal for Divi 5 visual builder that displays the state of the layout:

- Hovered module
- Selected module
- Edited module
- Active view
- Active breakpoint
- Active attribute state
- Number of selected module
- Keypress
- Triggered shortcuts

## Showcased examples
This extension is the example of "options 3: Importing Divi packages from window variables as externals using webpack" [mentioned on this documentation](https://github.com/elegantthemes/submodule-builder/blob/d5-initial-development/docs/docs/internal/third-party-integration/extending-d5-visual-builder.md#option-3-importing-divi-packages-from-window-variables-as-externals-using-webpack-module-bundler)
Technically, examples that can be drawn from this extension samples:

- Custom modal on D5 visual builder extension.
- Using D5 packages as external and use type declaration package to add proper typing.
- Webpack configuration for D5 visual builder extension that do the following:
  - [Use already enqueued script as externals.](https://github.com/elegantthemes/d5i-modal-dev-state-monitor/blob/main/webpack.config.js#L11-L33)
  - [Module rules that handle tsx, ts, jsx, css, scss, spawn multiple process and split works to make faster build process, transpile newer syntax into older syntax, etc](https://github.com/elegantthemes/d5i-modal-dev-state-monitor/blob/main/webpack.config.js#L39-L130)
  - [Extract and output CSS into its own file using plugins.](https://github.com/elegantthemes/d5i-modal-dev-state-monitor/blob/main/webpack.config.js#L133-L140)
- [tsconfig.json for typescript configuration](https://github.com/elegantthemes/d5i-modal-dev-state-monitor/blob/main/tsconfig.json)
- [Registered onClick event on admin bar item on top window.](https://github.com/elegantthemes/d5i-modal-dev-state-monitor/blob/main/src/index.ts#L14-L31)
- [Using typed component from components imported as externals](https://github.com/elegantthemes/d5i-modal-dev-state-monitor/blob/main/src/components/modal/component.tsx#L17-L24)
- [Using Higher Order Component to retrieve data from store and pass it into custom modal component.](https://github.com/elegantthemes/d5i-modal-dev-state-monitor/blob/main/src/components/modal/container.ts#L22-L79)

## Screenshots
![Click here to open Divi 5 Dev Tool](https://user-images.githubusercontent.com/916442/178093897-5846e59c-8f95-40ec-b328-e0cecf034bbb.png)
Click here to open Divi 5 Dev Tool.


![State monitor modal features](https://user-images.githubusercontent.com/916442/178093900-1e70d508-8bd9-4b2d-a54a-8475b206e075.png)
State monitor modal features.