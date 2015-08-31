var WIDTH = 750;
var HEIGHT = 750;
var SPACING = 2;
var SQRTTHREE = Math.sqrt(3);
var MC_SPEED = 100;
//var MC_STEPS = 100;

$(function() {
    var mc_random = null;
    var temp_changing = null;
    var redraw_interval = null;

    $("#tempselect").slider({
	min: 0.1,
	max: 10,
	step: 0.1,
	value: 5
    });
    $("#sizeselect").slider({
	min: 1,
	max: 50,
	step: 1,
	value: 10,
	change: function(event, ui) { setSquareCells(); redraw(); }
    });
    $("#min_energy").click(function() { setMinEnergyCells(); });
    $("#max_energy").click(function() { setMaxEnergyCells(); });
    $("#montecarlo").click(function() {
	setup_mc();
    });
    $("#heatup").click(function() {
	setup_mc();
	temp_changing = setInterval(function() { change_temp(0.1); }, 500);
    });
    $("#anneal").click(function() {
	setup_mc();
	temp_changing = setInterval(function() { change_temp(-0.1); }, 500);
    });
    $("input:radio[name=board]").click(function() { 
	if(board_type() == "square") {
	    $("#sphere_border").slideDown();
	    $("#mobius_border").slideDown();
	    $("#klein_border").slideDown();
	    $("#projective_border").slideDown();
	} else {
	    $("#sphere_border").slideUp();
	    $("#mobius_border").slideUp();
	    $("#klein_border").slideUp();
	    $("#projective_border").slideUp();
	}
	redraw(); 
    });
    $("input:radio[name=show]").click(function() { redraw(); });

    function change_temp(amount) {
	var t = $("#tempselect").slider("value");
	if(t+amount > $( "#tempselect" ).slider( "option", "max" ) || t+amount < $( "#tempselect" ).slider( "option", "min" )) {
	    clear_mc();
	    return;
	}
	$("#tempselect").slider("value", t + amount);
    }

    function setup_mc() {
	$("#montecarlo").html("Click on board to stop").attr("disabled", true).switchClass("btn-warning","btn-success");
	$("#heatup").attr("disabled", true).fadeOut();
	$("#anneal").attr("disabled", true).fadeOut();
	mc_random = setInterval(function() { monte_carlo(); }, MC_SPEED);
    }

    function clear_mc() {
	var res = false;
	if(mc_random) {
	    clearInterval(mc_random);
	    mc_random = null;
	    res = true;
	}
	if(temp_changing) {
	    clearInterval(temp_changing);
	    temp_changing = null;
	}
	$("#montecarlo").attr("disabled", false).switchClass("btn-success","btn-warning").html("Randomly Choose");
	$("#heatup").attr("disabled", false).fadeIn();
	$("#anneal").attr("disabled", false).fadeIn();
	return res;
    };


var size = function() { 
    return $("#sizeselect").slider("value");
};
var board_type = function () { return $("input:radio[name=board]:checked").val(); }
var border_type = function () { return $("input:radio[name=borders]:checked").val(); }
var show_type = function () { return $("input:radio[name=show]:checked").val(); }

var env = {};

function updateEnv() {
    env.size = size();
    env.total = total();
    env.board = board_type();
    env.prob = beta_prob();
    env.top = border_type();
    env.wo = width_offset();
    env.ws = width_step();
    env.ho = height_offset();
    env.hs = height_step();
    env.show = show_type();
}

function step_function(base) {
    var b = board_type();
    var s = size();
    if(b == "square") {
	return base / s; 
    } else if(b == "hexagon") {
	return base / s * (s - 1/2) / s;
    }
    return 0;
}
var width_step = function() { 
    return step_function(WIDTH);
}
var height_step = function() { 
    return step_function(HEIGHT);
}
var num_in_row = function() { return size(); }
var total = function() { 
    var b = board_type();
    var s = size();
    if(b == "square") {
	return Math.pow(s, 2); 
    } else if(b == "hexagon") {
	return Math.pow(s, 2); 
//	return 3*Math.pow(s, 2) - 3*s + 1;
    }
    return 0;
}
var width_offset = function() { return width_step() / 2; }
var height_offset = function() { return height_step() / 2; }
//var temperature = 2;
var beta_prob = function() { return Math.exp(-2 / $("#tempselect").slider("value")); }
var switch_spin = function(prob) { return Math.random() < prob;} 

var coord_inc_x = function(n) {
    if(n === null) { return null; }
    if( (n+1) % env.size == 0) {
	switch(env.top) {
	    case "torus":
	    return n + 1 - env.size;
	    case "sphere":
	    return (env.size * n + Math.floor(n / env.size)) % env.total;
	    case "mobius":
	    case "klein":
	    case "projective":
	    return env.total - (n + 1);
	    default:
	    return null;
	}
    } else {
	return n + 1;
    }
    //return (n + 1) % s == 0 ? (through_border() ? n - s + 1 : null) : n + 1;
}
var coord_dec_x = function(n) {
    if(n === null) { return null; }
    if( n % env.size == 0) {
	switch(env.top) {
	    case "torus":
	    return n - 1 + env.size;
	    case "sphere":
	    return (env.size * n + Math.floor(n / env.size)) % env.total;
	    case "mobius":
	    case "klein":
	    case "projective":
	    return env.total - (n + 1);
	    default:
	    return null;
	}
    } else {
	return n - 1;
    }
    //return n % s == 0 ? (through_border() ? n + s - 1 : null) : n - 1;
}

var coord_inc_y = function(n) {
    if(n === null) { return null; }
    if( (n + env.size) >= env.total) {
	switch(env.top) {
	    case "klein":
	    case "torus":
	    return n + env.size - env.total;
	    case "sphere":
	    return (env.size * n + Math.floor(n / env.size)) % env.total;
	    case "projective":
	    return env.total - (n + 1);
	    case "mobius":
	    default:
	    return null;
	}
    } else {
	return n + env.size;
    }
    //return (n + s) >= t ? (through_border() ? n + s - t : null) : n + s;
}
var coord_dec_y = function(n) {
    if(n === null) { return null; }
    if( (n - env.size) < 0) {
	switch(env.top) {
	    case "klein":
	    case "torus":
	    return n - env.size + env.total;
	    case "sphere":
	    return (env.size * n + Math.floor(n / env.size)) % env.total;
	    case "projective":
	    return env.total - (n + 1);
	    case "mobius":
	    default:
	    return null;
	}
    } else {
	return n - env.size;
    }
    //return n - s < 0 ? (through_border() ? n - s + t : null) : n - s;
}

function num_to_coord(n) {
    var a = n % env.size;
    var b = Math.floor(n / env.size);
    var x = a - (b - (b&1)) / 2
    var z = b
    var y = -x-z
    return {x: x, y: y, z: z};
}

function coord_to_num(c) {
    var a = c.x + (c.z - (c.z&1)) / 2
    var b = c.z
    return b*env.size + a;
}
var coord_diag_down_right = function(n) {
    if(n === null) { return null; }
    var y_par = Math.floor(n / env.size) % 2;
    var next =  n + env.size + y_par;
    if( next >= env.total) {
	switch(env.top) {
	    case "torus":
	    return  env.total - (n + 1);
	    default:
	    return null;
	}
    } else {
	return next;
    }
}

var coord_diag_up_left = function(n) {
    if(n === null) { return null; }
    if( (n + env.size) >= env.total) {
	switch(env.top) {
	    case "torus":
	    return  env.total - (n + 1);
	    default:
	    return null;
	}
    } else {
	return n - env.size1;
    }
}

// var coord_diag_down_right = function(n) {
//     if(n === null) { return null; }
//     var coord = num_to_coord(n);
//     var next =  {coord.x, coord.y - 1, coord.z +1};
//     var next_num = coord_to_num(next);
//     if( next_num >= env.total) {
// 	switch(env.top) {
// 	    case "torus":
// 	    return  env.total - (n + 1);
// 	    default:
// 	    return null;
// 	}
//     } else {
// 	return next_num;
//     }
// }

// var coord_diag_up_left = function(n) {
//     if(n === null) { return null; }
//     if( (n + env.size) >= env.total) {
// 	switch(env.top) {
// 	    case "torus":
// 	    return  env.total - (n + 1);
// 	    default:
// 	    return null;
// 	}
//     } else {
// 	return n - env.size1;
//     }
// }

function get_neighbours(n) {
    if(env.board == "square") {
	var down  = coord_inc_y(n);
	var up    = coord_dec_y(n);
	var right = coord_inc_x(n);
	var left  = coord_dec_x(n);
	return {down: down, up: up, right: right, left: left};
    } else if(env.board == "hexagon") {
	var ul = coord_dec_y(n);
	var ur = coord_inc_x(coord_dec_y(n));
	var l = coord_dec_x(n);
	var r = coord_inc_x(n);
	var dl = coord_inc_y(n);
	var dr = coord_inc_x(coord_inc_y(n));
	return {upleft: ul, upright: ur, left: l, right: r, downleft: dl, downright: dr};
    } else {
	return {};
    }
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function find_pocket(spin, n) {
    squareCells[n].spin *= -1;
    squareCells[n].flipped++;
    squareCells[n].just_flipped = true;
    squareCells[n].avg_flipped += squareCells[n].last_flipped;
    squareCells[n].last_flipped = 0;
    var neighbours = get_neighbours(n);
    var keys = Object.keys(neighbours);
    shuffle(keys);
    for(var i = 0; i < keys.length; i++) {
	var key = keys[i];
	if(neighbours[key] !== null) {
	    if(squareCells[neighbours[key]].spin == spin && switch_spin(env.prob)) {
		find_pocket(spin, neighbours[key]);
	    }
	}
    }
    return;
}

function energy_at_coord(n) {
    var neighbours = get_neighbours(n);
    e = 0;
    own_spin = squareCells[n].spin;
    var s = 0;
    for(var key in neighbours) {
	if(neighbours[key] !== null) {
	    e += own_spin * squareCells[neighbours[key]].spin;
	    s++;
	}
    }
    return -1*e;
}

function energy() {
    var t = total();
    var e = 0;
    for(var i = 0; i < t; i++) {
	e += energy_at_coord(i);
    }
    return e;
}

var num_to_coord = function(n) {
    return {"x": Math.floor(n % num_in_row()),
	    "y": Math.floor(n / num_in_row())};
};
var coord_to_num = function(c) {
    return c.x * num_in_row() + c.y;
};

var squareCells = [];
var arrows = [0,0,0,0];

var svg = d3.select("#ising_square").append("svg")
    .attr("width", WIDTH + width_offset())
    .attr("height", HEIGHT + height_offset());

function setMinEnergyCells() {
    var spin = Math.random() > 0.5 ? 1 : -1;
    for(var i = 0; i < env.total; i++) {
	squareCells[i].spin = spin;
    }
    redraw();
};

function setMaxEnergyCells() {
    var spin = Math.random() > 0.5 ? 1 : -1;
    for(var i = 0; i < env.total; i++) {
	var c = squareCells[i];
	var parity = (c.x + c.y) % 2 == 0 ? 1 : -1;
	squareCells[i].spin = parity * spin;
	//console.log(squareCells[i].spin);
    }
    redraw();
};

function setSquareCells() {
    squareCells = d3.range(total()).map(function(d) {
	var b = board_type();
	var c = {x: 0, y: 0}
	if(b == "square") {
	    c = num_to_coord(d);
	} else if (b == "hexagon") {
	    c = num_to_coord(d);
	}
	return {x: c.x, y: c.y, spin: Math.random() > 0.5 ? 1 : -1, state: 0, flipped: 0, last_flipped: 0, avg_flipped: 0, just_flipped: false}
    });
    redraw();
};

setSquareCells();

function monte_carlo() {
//    var i = total() % 2 == 0 ? total() / 2 + Math.floor(size() / 2) : Math.floor(total() / 2);//Math.floor(Math.random() * total());
    var i = Math.floor(Math.random() * env.total);
//    for(var j = 0; j < MC_STEPS; j++) {
	find_pocket(squareCells[i].spin, i);
//	if(j-1 != MC_STEPS) {
//	    updateSpins();
//	}
//    }
    redraw();
}

function get_x(d) {
    if(env.board == "square") {
	return d.x * env.ws + env.wo;
    } else {		 
	return d.y % 2 == 0 ? d.x * env.ws + env.wo : d.x * env.ws + env.ws/2 + env.wo;
    }
}

function get_y(d) {
    if(env.board == "square") {
	return d.y * env.hs + env.ho;
    } else {
	return d.y * env.hs + env.ho;
    }
}

function get_avg_flips(d) {
    return (d.avg_flipped + d.last_flipped) / (d.flipped + 1);
}

function updateSpins() {
    var flip_max = 0;
    var flip_min = Infinity;
    if(show_type() == "freq") {
	for(var i = 0; i < total(); i++) {
	    var c = squareCells[i];
	    c.state += c.spin;
	    var avg_flips = get_avg_flips(c);
	    //console.log(c.avg_flipped, c.last_flipped, c.flipped, avg_flips);
	    flip_max = Math.max(flip_max, avg_flips);
	    flip_min = Math.min(flip_min, avg_flips);
	    c.last_flipped++;
	}
    } else {
	for(var i = 0; i < total(); i++) {
	    squareCells[i].state = 0;
	    squareCells[i].flipped = 0;
	    squareCells[i].avg_flipped = 0;
	    squareCells[i].last_flipped = 0;
	}
    }
    //console.log(flip_min, flip_max, flip_max-flip_min);
    return {max: flip_max, min: flip_min, inv_diff: 1 / (flip_max - flip_min)};
}

function none_flipped() {
	for(var i = 0; i < total(); i++) {
	    squareCells[i].just_flipped = false;
	}
}

function redraw() {
    clearInterval(redraw_interval);
    var cleanup = false;
    updateEnv();

    var squareModel = svg.selectAll("circle").data(squareCells);
    var r =  (Math.min( env.ws, env.hs )) / 2.0 - SPACING;
    var sh_m = updateSpins();
    
    squareModel
	.exit()
	.remove();
 
    squareModel.transition()
	.attr("cx", get_x)
	.attr("cy", get_y)
	.attr("r", r)
	.attr("fill", function(d) {
	    if(env.show == "freq") {
		var val = Math.sqrt((get_avg_flips(d) - sh_m.min) * sh_m.inv_diff);
		return "rgba(0,0,0,"+val+")";
	    } else {
		if(d.just_flipped) {
		    cleanup = true;
		    return d.spin == 1 ? "rgba(255,0,0,0.5)" : "rgba(0,0,0,0.5)";
		} else {
		    return d.spin == 1 ? "red" : "black";
		}
	    }
	})
	.attr("width", env.ws)
	.attr("height", env.hs);

   squareModel
	.enter()
	.append("circle")
	.attr("cx", get_x)
	.attr("cy", get_y)
	.attr("r", r)
	.attr("fill", function(d) {
	    if(env.show == "freq") {
		var val = Math.sqrt((get_avg_flips(d) - sh_m.min) * sh_m.inv_diff);
		return "rgba(0,0,255,"+val+")";
	    } else {
		var opacity = d.just_flipped ? 0.8 : 1.0;
		return d.spin == 1 ? "rgba(255,0,0,"+opacity+")" : "rgba(0,0,0,"+opacity+")";
	    }
	})
	.attr("width", env.ws)
	.attr("height", env.hs)
	.on("click", function(d, i) {
	    if(clear_mc()) { return; }
	    find_pocket(d.spin, i);
	    //d3.select(squareCells).transition().attr("fill", "green");
	    redraw();
	    //console.log(d);
	});
    // new_cells
    // 	.append("circle")
    // 	.attr("cx", function(d) { return get_x(b,ws,wo,d) - 3; })
    // 	.attr("cy", function(d) { return get_y(b,hs,ho,d) - 3; })
    // 	.attr("r", r)
    // 	.attr("fill", "rgba(0,255,0,0.3)")
    // 	.attr("width", ws)
    // 	.attr("height", hs);

    none_flipped();

    if(cleanup && (mc_random === null)) {
	redraw_interval = setTimeout(function() {redraw();}, 300);
    }
    
    $("#energy").text(energy());
};

redraw();

});
