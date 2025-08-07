<?php
/**
 * AJAX Handlers for Divi Options Management
 *
 * @package Divi5DevTool
 * @since 1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Process serialized data to convert serialized strings to arrays.
 *
 * @param mixed $data      Data to process.
 * @param int   $depth     Current depth level.
 * @param int   $max_depth Maximum depth to process.
 * @return mixed Processed data.
 */
function divi_5_dev_tool_process_serialized_data( $data, $depth = 0, $max_depth = 5 ) {
	// Prevent infinite recursion.
	if ( $depth > $max_depth ) {
		return $data;
	}

	if ( is_string( $data ) ) {
		// Check if it's a serialized string.
		$unserialized = @unserialize( $data );
		if ( false !== $unserialized || 'b:0;' === $data ) {
			// It's serialized, return the unserialized data with special marker.
			return array(
				'__serialized_data__' => true,
				'__original_value__'   => $data,
				'data'                 => divi_5_dev_tool_process_serialized_data( $unserialized, $depth + 1, $max_depth ),
			);
		}
	} elseif ( is_array( $data ) ) {
		// Recursively process array elements.
		$processed = array();
		foreach ( $data as $key => $value ) {
			$processed[ $key ] = divi_5_dev_tool_process_serialized_data( $value, $depth + 1, $max_depth );
		}
		return $processed;
	}

	return $data;
}

/**
 * Process update value to detect and convert data types.
 *
 * @param mixed $value Value to process.
 * @return mixed Processed value.
 */
function divi_5_dev_tool_process_update_value( $value ) {
	// If it's already not a string, return as is.
	if ( ! is_string( $value ) ) {
		return $value;
	}

	// Try to detect JSON.
	if ( ( $value[0] === '{' && substr( $value, -1 ) === '}' ) || ( $value[0] === '[' && substr( $value, -1 ) === ']' ) ) {
		$json_decoded = json_decode( $value, true );
		if ( json_last_error() === JSON_ERROR_NONE ) {
			return $json_decoded;
		}
	}

	// Try to detect boolean values.
	if ( 'true' === strtolower( $value ) ) {
		return true;
	}
	if ( 'false' === strtolower( $value ) ) {
		return false;
	}

	// Try to detect numeric values.
	if ( is_numeric( $value ) ) {
		// Check if it's an integer.
		if ( (string) (int) $value === $value ) {
			return (int) $value;
		}
		// Otherwise it's a float.
		return (float) $value;
	}

	// Return as string.
	return $value;
}

/**
 * Update a single Divi option using et_update_option.
 *
 * @param string $key   The option key.
 * @param mixed  $value The option value.
 * @throws Exception If the update fails.
 */
function divi_5_dev_tool_update_single_option( $key, $value ) {
	// Handle options that need serialization.
	$serialized_options = array(
		'et_global_data',
		'global_variables',
		'et_global_colors',
		'builder_global_presets_d5',
	);

	if ( in_array( $key, $serialized_options, true ) ) {
		// These options need to be serialized before saving.
		et_update_option( $key, maybe_serialize( $value ) );
	} else {
		// Regular options.
		et_update_option( $key, $value );
	}
}

/**
 * Update a nested Divi option by reconstructing the parent option.
 *
 * @param array  $nested_keys The nested key path.
 * @param string $key         The final key to update.
 * @param mixed  $value       The value to set.
 * @throws Exception If the update fails.
 */
function divi_5_dev_tool_update_nested_option( $nested_keys, $key, $value ) {
	// Get the root option name (first nested key).
	$root_option = $nested_keys[0];

	// Get current option value.
	$option_value = et_get_option( $root_option, array() );

	// Handle serialized options.
	$serialized_options = array(
		'et_global_data',
		'global_variables',
		'et_global_colors',
		'builder_global_presets_d5',
	);

	if ( in_array( $root_option, $serialized_options, true ) ) {
		$option_value = maybe_unserialize( $option_value );
	}

	if ( ! is_array( $option_value ) ) {
		$option_value = array();
	}

	// Navigate to the nested location (skip root option and serialized data markers).
	$current   = &$option_value;
	$path_keys = array_slice( $nested_keys, 1 ); // Skip root option.

	foreach ( $path_keys as $nested_key ) {
		// Skip processed serialized data markers.
		if ( '__serialized_data__' === $nested_key || '__original_value__' === $nested_key ) {
			continue;
		}

		// Handle 'data' key for serialized content.
		if ( 'data' === $nested_key && isset( $current['__serialized_data__'] ) ) {
			// We're updating within serialized data, get the actual data.
			if ( ! isset( $current['data'] ) || ! is_array( $current['data'] ) ) {
				$current['data'] = array();
			}
			$current = &$current['data'];
			continue;
		}

		if ( ! isset( $current[ $nested_key ] ) || ! is_array( $current[ $nested_key ] ) ) {
			$current[ $nested_key ] = array();
		}
		$current = &$current[ $nested_key ];
	}

	// Set the value.
	$current[ $key ] = $value;

	// Update the root option.
	divi_5_dev_tool_update_single_option( $root_option, $option_value );
}

/**
 * Delete a single Divi option using et_delete_option.
 *
 * @param string $key The option key.
 * @throws Exception If the deletion fails.
 */
function divi_5_dev_tool_delete_single_option( $key ) {
	// Use et_delete_option for consistency with Divi.
	et_delete_option( $key );
}

/**
 * Delete a nested key from a Divi option by reconstructing the parent option.
 *
 * @param array  $nested_keys The nested key path.
 * @param string $key         The final key to delete.
 * @throws Exception If the deletion fails.
 */
function divi_5_dev_tool_delete_nested_option( $nested_keys, $key ) {
	// Get the root option name (first nested key).
	$root_option = $nested_keys[0];

	// Get current option value.
	$option_value = et_get_option( $root_option, array() );

	// Handle serialized options.
	$serialized_options = array(
		'et_global_data',
		'global_variables',
		'et_global_colors',
		'builder_global_presets_d5',
	);

	if ( in_array( $root_option, $serialized_options, true ) ) {
		$option_value = maybe_unserialize( $option_value );
	}

	if ( ! is_array( $option_value ) ) {
		throw new Exception( 'Option is not an array, cannot delete nested key' );
	}

	// Navigate to the nested location (skip root option and serialized data markers).
	$current   = &$option_value;
	$path_keys = array_slice( $nested_keys, 1 ); // Skip root option.

	foreach ( $path_keys as $nested_key ) {
		// Skip processed serialized data markers.
		if ( '__serialized_data__' === $nested_key || '__original_value__' === $nested_key ) {
			continue;
		}

		// Handle 'data' key for serialized content.
		if ( 'data' === $nested_key && isset( $current['__serialized_data__'] ) ) {
			// We're deleting within serialized data, get the actual data.
			if ( ! isset( $current['data'] ) || ! is_array( $current['data'] ) ) {
				throw new Exception( 'Serialized data not found or not an array' );
			}
			$current = &$current['data'];
			continue;
		}

		if ( ! isset( $current[ $nested_key ] ) || ! is_array( $current[ $nested_key ] ) ) {
			throw new Exception( 'Nested key path not found: ' . $nested_key );
		}
		$current = &$current[ $nested_key ];
	}

	// Check if the key exists before deleting.
	if ( ! isset( $current[ $key ] ) ) {
		throw new Exception( 'Key not found: ' . $key );
	}

	// Delete the key.
	unset( $current[ $key ] );

	// Update the root option.
	divi_5_dev_tool_update_single_option( $root_option, $option_value );
}

/**
 * AJAX handler for getting Divi options.
 */
function divi_5_dev_tool_get_divi_options() {
	// Check nonce for security.
	if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'divi_5_dev_tool_nonce' ) ) {
		wp_die( 'Security check failed' );
	}

	// Check user capabilities.
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Insufficient permissions' );
	}

	$divi_options = get_option( 'et_divi', array() );

	// Convert serialized strings to arrays for better handling in JavaScript.
	$processed_options = divi_5_dev_tool_process_serialized_data( $divi_options );

	wp_send_json_success( $processed_options );
}

/**
 * AJAX handler for updating Divi options.
 */
function divi_5_dev_tool_update_divi_option() {
	// Check nonce for security.
	if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'divi_5_dev_tool_nonce' ) ) {
		wp_send_json_error( array( 'message' => 'Security check failed' ) );
		return;
	}

	// Check user capabilities.
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( array( 'message' => 'Insufficient permissions' ) );
		return;
	}

	$key         = isset( $_POST['key'] ) ? sanitize_text_field( wp_unslash( $_POST['key'] ) ) : '';
	$value       = isset( $_POST['value'] ) ? wp_unslash( $_POST['value'] ) : '';
	$nested_keys = isset( $_POST['nested_keys'] ) ? json_decode( sanitize_text_field( wp_unslash( $_POST['nested_keys'] ) ), true ) : array();

	if ( empty( $key ) ) {
		wp_send_json_error( array( 'message' => 'Key is required' ) );
		return;
	}

	// Process the value - try to detect the intended type.
	$processed_value = divi_5_dev_tool_process_update_value( $value );

	try {
		// Handle nested key updates vs direct updates.
		if ( ! empty( $nested_keys ) ) {
			// For nested updates, we need to update the parent option.
			divi_5_dev_tool_update_nested_option( $nested_keys, $key, $processed_value );
		} else {
			// For direct updates, use et_update_option directly.
			divi_5_dev_tool_update_single_option( $key, $processed_value );
		}

		wp_send_json_success( array(
			'message' => 'Option updated successfully',
		) );

	} catch ( Exception $e ) {
		wp_send_json_error( array(
			'message' => 'Failed to update option: ' . $e->getMessage(),
		) );
	}
}

/**
 * AJAX handler for deleting Divi options.
 */
function divi_5_dev_tool_delete_divi_option() {
	// Check nonce for security.
	if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'divi_5_dev_tool_nonce' ) ) {
		wp_send_json_error( array( 'message' => 'Security check failed' ) );
		return;
	}

	// Check user capabilities.
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( array( 'message' => 'Insufficient permissions' ) );
		return;
	}

	$key         = isset( $_POST['key'] ) ? sanitize_text_field( wp_unslash( $_POST['key'] ) ) : '';
	$nested_keys = isset( $_POST['nested_keys'] ) ? json_decode( sanitize_text_field( wp_unslash( $_POST['nested_keys'] ) ), true ) : array();

	if ( empty( $key ) ) {
		wp_send_json_error( array( 'message' => 'Key is required' ) );
		return;
	}

	try {
		// Handle nested key deletion vs direct deletion.
		if ( ! empty( $nested_keys ) ) {
			// For nested deletions, we need to update the parent option.
			divi_5_dev_tool_delete_nested_option( $nested_keys, $key );
		} else {
			// For direct deletions, use et_delete_option.
			divi_5_dev_tool_delete_single_option( $key );
		}

		wp_send_json_success( array(
			'message' => 'Option deleted successfully',
		) );

	} catch ( Exception $e ) {
		wp_send_json_error( array(
			'message' => 'Failed to delete option: ' . $e->getMessage(),
		) );
	}
}

// Register AJAX handlers.
add_action( 'wp_ajax_divi_5_dev_tool_get_divi_options', 'divi_5_dev_tool_get_divi_options' );
add_action( 'wp_ajax_divi_5_dev_tool_update_divi_option', 'divi_5_dev_tool_update_divi_option' );
add_action( 'wp_ajax_divi_5_dev_tool_delete_divi_option', 'divi_5_dev_tool_delete_divi_option' );
