from typing import Dict, Any, List
import networkx as nx


class GraphEngine:
    @staticmethod
    def analyze_network(
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        source_sink: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """
        Runs network analytics on logistics/supply chain nodes and edges using NetworkX.
        
        nodes: List of dicts, e.g. [{"id": "NodeA", "label": "Warehouse"}]
        edges: List of dicts, e.g. [{"source": "NodeA", "target": "NodeB", "weight": 10, "capacity": 100}]
        source_sink: Dict, e.g. {"source": "NodeA", "sink": "NodeC"} (optional)
        """
        G = nx.DiGraph()

        # Add nodes
        for node in nodes:
            node_id = str(node["id"])
            G.add_node(node_id, **{k: v for k, v in node.items() if k != "id"})

        # Add edges
        for edge in edges:
            source = str(edge["source"])
            target = str(edge["target"])
            weight = float(edge.get("weight", 1.0))
            capacity = float(edge.get("capacity", 1.0))
            G.add_edge(source, target, weight=weight, capacity=capacity)

        # 1. Bottleneck Analysis: Betweenness Centrality
        # Nodes with high centrality control flows in the network.
        betweenness = nx.betweenness_centrality(G, weight="weight")

        # 2. Shortest route calculation (if source/sink are supplied)
        shortest_path = None
        shortest_path_length = None
        if source_sink and source_sink.get("source") in G and source_sink.get("sink") in G:
            src = str(source_sink["source"])
            snk = str(source_sink["sink"])
            try:
                shortest_path = nx.dijkstra_path(G, source=src, target=snk, weight="weight")
                shortest_path_length = nx.dijkstra_path_length(G, source=src, target=snk, weight="weight")
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                pass

        # 3. Maximum network capacity: Max Flow (if source/sink are supplied)
        max_flow_val = None
        max_flow_dict = None
        if source_sink and source_sink.get("source") in G and source_sink.get("sink") in G:
            src = str(source_sink["source"])
            snk = str(source_sink["sink"])
            try:
                max_flow_val, max_flow_dict = nx.maximum_flow(G, src, snk, capacity="capacity")
            except (nx.NetworkXError, nx.NodeNotFound):
                pass

        return {
            "status": "SUCCESS",
            "results": {
                "bottlenecks": {k: float(v) for k, v in betweenness.items()},
                "shortest_path": shortest_path,
                "shortest_path_length": shortest_path_length,
                "max_flow_value": max_flow_val,
                "max_flow_distribution": max_flow_dict,
            },
            "metrics": {
                "node_count": G.number_of_nodes(),
                "edge_count": G.number_of_edges(),
            }
        }
