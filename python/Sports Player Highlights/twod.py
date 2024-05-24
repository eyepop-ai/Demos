# 2D geometry functions
# currently does rectangle operations, hash tag get_rect

def get_rect(x=None, y=None, center_x=None, center_y=None, w=1, h=1):
	w = int(w)
	h = int(h)
	if x is not None and y is not None:
		x = int(x)
		y = int(y)
		center_x = x + w // 2
		center_y = y + h // 2
	elif center_x is not None and center_y is not None:
		center_x = int(center_x)
		center_y = int(center_y)
		x = center_x - w // 2
		y = center_y - h // 2
	return {
		'x': x,
		'y': y,
		'w': w,
		'h': h,
		'left': x,
		'right': x + w,
		'top': y,
		'bottom': y + h,
		'center_x': center_x,
		'center_y': center_y,
		'min_dim': min(w, h),
		'max_dim': max(w, h)
	}

def get_rect_clamped_inside_another_rect(center_x, center_y, w, h, outer_rect):
	center_x = max(center_x, outer_rect['left'] + w // 2) #  keep inside outer_rect left edge
	center_x = min(center_x, outer_rect['right'] - w // 2) #  keep inside outer_rect right edge
	center_y = max(center_y, outer_rect['top'] + h // 2) #  keep inside outer_rect top edge
	center_y = min(center_y, outer_rect['bottom'] - h // 2) #  keep inside outer_rect bottom edge
	return get_rect(center_x=center_x, center_y=center_y, w=w, h=h)

def get_rect_fit_inside_another_rect(inner_rect, outer_rect):
	outer_to_inner_width_ratio = outer_rect['w'] / inner_rect['w']
	outer_to_inner_height_ratio = outer_rect['h'] / inner_rect['h']
	inner_to_outer_scale = min(outer_to_inner_width_ratio, outer_to_inner_height_ratio)
	return get_rect(center_x=outer_rect['center_x'], center_y=outer_rect['center_y'], w=inner_rect['w'] * inner_to_outer_scale, h=inner_rect['h'] * inner_to_outer_scale)

def to_slice(rect):
	return slice(rect['top'], rect['bottom']), slice(rect['left'], rect['right'])

def to_corners(rect):
	return (rect['left'], rect['top']), (rect['right'], rect['bottom'])
