function expand(G,G_prime,P_prime){
	if(!P_prime.includes(G.length)){
		return P_prime;
	}
	var cycle = G_prime[G.length].cycle;
	var pos = P_prime.indexOf(G.length);
	if (pos%2==0){ 
		var non_stem_neighbor = P_prime[pos+1];
		var reverse_middle = true;
	} else {  
		var non_stem_neighbor = P_prime[pos-1];
		var reverse_middle = false;
	}
	if(G[non_stem_neighbor].adj.includes(cycle[0])){
		P_prime[pos] = cycle[0];
		return P_prime;
	} else {
		var first_half = P_prime.slice(0,pos);
		var second_half = P_prime.slice(pos+1,P_prime.length);
		var start;
		for(let i = 1; i<cycle.length-1; i++){
			if(G[cycle[i]].adj.includes(non_stem_neighbor)){
				start = i;
				break;
			}
		}
		var middle = [];
		if(G[cycle[start]].partner === cycle[start-1]){
			for(let i = start; i >= 0; i--){
				middle.push(cycle[i]);
			}
		} else {
			for(let i = start; i < cycle.length; i++){
				middle.push(cycle[i]);
			}
		}
		var P = first_half;
		if(reverse_middle){
			middle.reverse();
		}
		P = P.concat(middle);
		P = P.concat(second_half);
		return P;
	}
	return [];
}

function contract(G,v,w){
	var path_to_stem_v = [v];
	var path_to_stem_w = [w];
	while(G[v].mother !== -1){
		path_to_stem_v.push(G[v].mother);
		v = G[v].mother;
	}
	while(G[w].mother !== -1){
		path_to_stem_w.push(G[w].mother);
		w = G[w].mother;
	}
	var lowest_common_ancestor;
	while((path_to_stem_v.length>0)&&(path_to_stem_w.length>0)){
		if (path_to_stem_v[path_to_stem_v.length-1] === path_to_stem_w[path_to_stem_w.length-1]){
			lowest_common_ancestor = path_to_stem_v[path_to_stem_v.length-1];
			path_to_stem_v.pop();
			path_to_stem_w.pop();
		} else {
			break;
		}
	}
	var blossom = [lowest_common_ancestor].concat(path_to_stem_w.reverse());
	blossom = blossom.concat(path_to_stem_v);
	blossom.push(lowest_common_ancestor);
	var blossom_verteces = new Set(blossom);
	var G_size = G.length;
	var contracted_G = [];
	var blossom_vertex = {};
	blossom_vertex.adj = [];
	blossom_vertex.partner = -1;
	blossom_vertex.blossom = -1;
	blossom_vertex.cycle = blossom;
	for(let i = 0; i<G_size; i++){
		let vertex = {};
		if(G[i].blossom === -1){
			if(blossom_verteces.has(i)){
				vertex.blossom = G_size;
			} else {
				vertex.blossom = -1;
				if(blossom_verteces.has(G[i].partner)){
					vertex.partner = G_size;
					blossom_vertex.partner = i;
				} else {
					vertex.partner = G[i].partner;
				}
				vertex.adj = [];
				var points_to_blossom = false;
				for(let j = 0; j<G[i].adj.length; j++){
					if(blossom_verteces.has(G[i].adj[j])){
						points_to_blossom = true;
					} else {
						vertex.adj.push(G[i].adj[j]);
					}
				}
				if(points_to_blossom){
					vertex.adj.push(G_size);
					blossom_vertex.adj.push(i);
				}
			}
		} else {
			vertex.blossom = G[i].blossom;
		}
		contracted_G.push(vertex);
	}
	contracted_G.push(blossom_vertex);
	return contracted_G;
}

function BLOSSOM(adj){
	function invert(aug_path, G){
		for(let i = 0; i<aug_path.length/2; i++){
			G[aug_path[2*i]].partner = aug_path[2*i+1];
			G[aug_path[2*i+1]].partner = aug_path[2*i];
		}
	}
	function find_aug_path(G){
		function add_match_to_tree(v,w,wp){
			G[w].mother = v;
			G[wp].mother = w;
			G[w].root = G[v].root;
			G[wp].root = G[v].root;
			G[w].distance = G[v].distance + 1;
			G[wp].distance = G[v].distance + 2;
		}
		var G_size = G.length;
		var forest = [];
		for(let i = 0; i < G_size; i++){
			if(G[i].blossom === -1){
				G[i].mother = -1;
				if(G[i].partner === -1){
					forest.push(i)
					G[i].distance = 0;
					G[i].root = i;
				} else {
					G[i].root = -1;
					G[i].distance = G.length + 1;
				}
			}
		}
		for(let i = 0; i<forest.length; i++){
			var queue = [];
			queue.push(forest[i]);
			while(queue.length > 0){
				v = queue.shift();
				for(let j = 0; j < G[v].adj.length; j++){
					w = G[v].adj[j];
					if(G[w].partner === -1){
						var P = [v,w];
						while(G[v].mother !== -1){
							P.unshift(G[v].mother);
							v = G[v].mother;
						}
						while(G[w].mother !== -1){
							P.push(G[w].mother);
							w = G[w].mother;
						}
						return P;
					}
				}
				for(let j = 0; j < G[v].adj.length; j++){
					w = G[v].adj[j];
					if ( (G[w].partner !== -1) && (G[w].root === -1) ){
						add_match_to_tree(v,w,G[w].partner);
						queue.push(G[w].partner);
					} else if(G[w].distance%2 === 1){
						continue;
					} else if( (G[w].root === G[v].root)&&(G[w].distance%2 === 0) ){
						var G_prime = contract(G,v,w);
						var P_prime = find_aug_path(G_prime);
						var P = expand(G,G_prime,P_prime);
						return P;
					} else {
						var P = [v,w];
						while(G[v].mother !== -1){
							P.unshift(G[v].mother);
							v = G[v].mother;
						}
						while(G[w].mother !== -1){
							P.push(G[w].mother);
							w = G[w].mother;
						}
						return P;
					}
				}
			}
		}
		return [];
	}
	var G_size = adj.length;
	var G = [];
	for(let i = 0; i<G_size; i++){
		let vertex = {};
		vertex.partner = -1;
		vertex.blossom = -1;
		vertex.adj = [];
		for (let j = 0; j < adj[i].length; j++){
			vertex.adj.push(adj[i][j]);
		}
		G.push(vertex);
	}
	while(true){
		let aug_path = find_aug_path(G);
		if(aug_path.length === 0){
			break;
		} else {
			invert(aug_path,G);
		}
	}
	var pairs = [];
        for(let i = 0; i<G.length; i++){
		if(i<G[i].partner){
			pairs.push([i,G[i].partner]);
		}
	}
	return pairs;
}
