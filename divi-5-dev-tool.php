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

use ET\Builder\Framework\Utility\Conditions;
use ET\Builder\VisualBuilder\Assets\PackageBuildManager;

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
	if ( ( function_exists( 'et_builder_d5_enabled' ) && et_builder_d5_enabled() && et_core_is_fb_enabled() ) || Conditions::is_tb_admin_screen() ) {
		$plugin_dir_url = plugin_dir_url( __FILE__ );

		PackageBuildManager::register( [
			'name'    => 'divi-5-dev-tool-builder-bundle',
			'version' => '0.1.2.' . rand(1, 10000000),
			'script'  => [
				'src'                => "{$plugin_dir_url}scripts/bundle.js",
				'deps'               => [
					// 'divi-visual-builder',
					'divi-data',
					'divi-error-boundary',
					'divi-modal',
					'divi-object-renderer',
				],
				'args'               => true,
				'data_app_window'    => [],
				'data_top_window'    => [],
				'enqueue_top_window' => false,
				'enqueue_app_window' => true,
			],
			'style' => [
				'src'                => "{$plugin_dir_url}styles/bundle.css",
				'deps'               => [],
				'args'               => [],
				'enqueue_top_window' => true,
				'enqueue_app_window' => false,
				'media'              => 'all',
			]
		] );
	}
}
add_action( 'et_fb_framework_loaded', 'divi_5_dev_tool_enqueue_scripts', 20 );

/**
 * Enqueue object renderer on top window
 */
function divi_5_dev_tool_enqueue_object_renderer_on_top_window( $params ) {
	// Enqueue object renderer style on top window. Layout panel needs it.
	$params['style']['enqueue_top_window'] = true;

	return $params;
}
add_filter( 'divi_visual_builder_package_build_params_divi-object-renderer', 'divi_5_dev_tool_enqueue_object_renderer_on_top_window' );
