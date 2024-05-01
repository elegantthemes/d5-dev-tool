<?php
/*
Plugin Name: Divi 5 Dev Tool
Plugin URI:  https://github.com/elegantthemes/d5-dev-tool
Description: A Divi 5 extension with various tools for developers.
Version:     0.1.2
Author:      Elegant Themes
Author URI:  https://elegantthemes.com
License:     GPL2
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: divi-5-dev-tool
Domain Path: /languages

Divi 5 Dev Tool is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
any later version.

Divi 5 Dev Tool is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Divi 5 Dev Tool. If not, see https://www.gnu.org/licenses/gpl-2.0.html.
*/

/**
 * Add custom item on admin bar for `Divi 5 Dev Tool`
 *
 * @since ??
 */
function divi_5_dev_tool_admin_bar_link( $admin_bar ) {

	// Only display this admin bar item on D5 Visual Builder.
	if ( function_exists( 'et_builder_d5_enabled' ) && et_builder_d5_enabled() && et_core_is_fb_enabled() ) {
		$d5_dev_tools_id = 'divi-5-dev-tool';

		// Main menu.
		$admin_bar->add_node(
			array(
				'id'    => $d5_dev_tools_id,
				'title' => __( 'Debug Divi 5', 'divi-5-dev-tool' ),
				'href'  => '#',
			)
		);
	}
}
add_action( 'admin_bar_menu', 'divi_5_dev_tool_admin_bar_link', 700 );

/**
 * Enqueue style and scripts of State Monitor modal
 *
 * @since ??
 */
function divi_5_dev_tool_enqueue_scripts() {
	if ( function_exists( 'et_builder_d5_enabled' ) && et_builder_d5_enabled() && et_core_is_fb_enabled() ) {
		$plugin_dir_url = plugin_dir_url( __FILE__ );

		wp_enqueue_script(
			'divi-5-dev-tool-builder-bundle-script',
			"{$plugin_dir_url}scripts/bundle.js",
			array(
				'divi-visual-builder',
				'divi-data',
				'divi-error-boundary',
				'divi-modal',
				'divi-object-renderer',
			),
			'0.1.2.' . rand(1, 10000000),
			true
		);

		wp_enqueue_style(
			'divi-5-dev-tool-builder-bundle-style',
			"{$plugin_dir_url}styles/bundle.css",
			array(),
			'0.1.2'
		);
	}
}
add_action( 'divi_visual_builder_assets_after_enqueue_package_script', 'divi_5_dev_tool_enqueue_scripts' );
