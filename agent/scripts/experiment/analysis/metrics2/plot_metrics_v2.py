
import sys
import os
import csv
import json
import matplotlib.pyplot as plt
import numpy as np

def main():
    # Hardcoded experiment directories
    base_dir = "/home/yuutaro/dev/payment-platform-2/agent/experiments"
    
    # Define models and their display order in the grid
    model_groups = {
        "GPT-5.2": {
            "on": "2026-01-31T11-47-56-129Z_gpt-5.2-2025-12-11_rag_on",
            "off": "2026-01-31T11-47-56-129Z_gpt-5.2-2025-12-11_rag_off"
        },
        "GPT-5 Mini": {
            "on": "2026-01-31T11-47-56-129Z_gpt-5-mini-2025-08-07_rag_on",
            "off": "2026-01-31T11-47-56-129Z_gpt-5-mini-2025-08-07_rag_off"
        },
        "Gemini 3 Pro": {
            "on": "2026-01-29T08-30-40-800Z_gemini-3-pro-preview_rag_on",
            "off": "2026-01-29T08-30-40-796Z_gemini-3-pro-preview_rag_off"
        },
        "Gemini 3 Flash": {
            "on": "2026-01-29T08-30-40-815Z_gemini-3-flash-preview_rag_on",
            "off": "2026-01-29T08-30-40-799Z_gemini-3-flash-preview_rag_off"
        }
    }

    # Custom color map
    color_map = {
        "gemini-3-pro-preview_rag_on": "#3333ff",
        "gemini-3-pro-preview_rag_off": "#000066",
        "gemini-3-flash-preview_rag_on": "#00ff99",
        "gemini-3-flash-preview_rag_off": "#339966",
        "gpt-5.2-2025-12-11_rag_on": "#ff0000",
        "gpt-5.2-2025-12-11_rag_off": "#800000",
        "gpt-5-mini-2025-08-07_rag_on": "#ffff00",
        "gpt-5-mini-2025-08-07_rag_off": "#cc9900",
    }
    
    # 1. Load Data
    data_store = {} # path -> data object

    # Collect all paths first
    # TARGET: similarity_metrics_v2.json
    target_filename = "similarity_metrics_v2.json"
    
    all_paths = []
    for m in model_groups.values():
        all_paths.append(os.path.join(base_dir, m["on"], target_filename))
        all_paths.append(os.path.join(base_dir, m["off"], target_filename))

    for file_path in all_paths:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data_store[file_path] = json.load(f)
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
        else:
            print(f"Warning: File not found {file_path}")

    # --- Plot 1: 2x2 Grid Distribution (Line Plot) ---
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    axes = axes.flatten() # Easy iteration

    # Bin settings
    num_bins = 100
    x_indices = np.arange(num_bins)
    
    # Iterate through models in defined order
    model_names = list(model_groups.keys()) # GPT-5.2, Mini, Pro, Flash

    for i, model_name in enumerate(model_names):
        ax = axes[i]
        group = model_groups[model_name]
        
        # Plot RAG ON and OFF
        for state in ["on", "off"]:
            dir_name = group[state]
            json_path = os.path.join(base_dir, dir_name, target_filename)
            
            if json_path not in data_store:
                continue

            data = data_store[json_path]
            dist = data['similarityDistribution']
            
            # Normalize
            total = sum(dist)
            norm_dist = [d / total for d in dist] if total > 0 else dist

            # Determine Color
            parts = dir_name.split('_')
            color_key = ""
            if 'rag' in parts:
                rag_idx = parts.index('rag')
                color_key = "_".join(parts[1:]) 
            
            color = color_map.get(color_key, 'gray')
            label = f"RAG {state.upper()}"
            
            # Plot Line
            ax.plot(x_indices, norm_dist, linewidth=1.5, label=label, color=color)
            ax.fill_between(x_indices, norm_dist, alpha=0.1, color=color)

        ax.set_title(model_name, fontsize=12, fontweight='bold')
        
        # Set ticks every 10 bins (0.1 step)
        tick_positions = np.arange(0, 101, 10)
        tick_labels = [f"{i/100:.1f}" for i in tick_positions]
        
        ax.set_xticks(tick_positions)
        ax.set_xticklabels(tick_labels, fontsize=9)
        ax.grid(True, linestyle='--', alpha=0.3)
        ax.legend()

    plt.tight_layout()
    
    # Save Grid Plot
    script_dir = os.path.dirname(os.path.abspath(__file__))
    figures_dir = os.path.join(script_dir, 'figures')
    if not os.path.exists(figures_dir):
        os.makedirs(figures_dir)
        
    grid_path = os.path.join(figures_dir, 'similarity_distribution_grid_v2.png')
    plt.savefig(grid_path, dpi=300)
    print(f"Grid Chart saved to: {grid_path}")
    plt.close()

    # --- Plot 2: Statistics Comparison (Grouped Bar Chart) ---
    plt.figure(figsize=(10, 6))
    
    stat_labels = []
    stat_avgs = []
    stat_colors = []
    
    for model_name in model_names:
        group = model_groups[model_name]
        for state in ["on", "off"]:
             dir_name = group[state]
             json_path = os.path.join(base_dir, dir_name, target_filename)
             if json_path in data_store:
                 data = data_store[json_path]
                 stat_labels.append(f"{model_name}\n({state.upper()})")
                 stat_avgs.append(data['averageSimilarity'])
                 
                 parts = dir_name.split('_')
                 color_key = "_".join(parts[1:]) if 'rag' in parts else ""
                 stat_colors.append(color_map.get(color_key, 'gray'))

    x_pos = np.arange(len(stat_labels))
    plt.bar(x_pos, stat_avgs, color=stat_colors, alpha=0.8, edgecolor='black', width=0.6)
    
    plt.ylabel('Average Cosine Similarity', fontsize=12)
    plt.title('Average Similarity by Model & RAG (Re-Embedded)', fontsize=14)
    plt.xticks(x_pos, stat_labels, rotation=45, ha='right', fontsize=9)
    plt.grid(axis='y', linestyle='--', alpha=0.5)
    
    for i, v in enumerate(stat_avgs):
        plt.text(i, v + 0.01, f"{v:.3f}", ha='center', fontsize=9)

    plt.tight_layout()
    stats_path = os.path.join(figures_dir, 'similarity_stats_v2.png')
    plt.savefig(stats_path, dpi=300)
    print(f"Stats Chart V2 saved to: {stats_path}")
    plt.close()

    # --- Calculation: Shift Metrics ---
    print("\n--- Shift Metrics Calculation (RAG OFF vs RAG ON) - Re-Embedded ---")
    
    metrics_results = []

    for model_name in model_names:
        group = model_groups[model_name]
        path_on = os.path.join(base_dir, group["on"], target_filename)
        path_off = os.path.join(base_dir, group["off"], target_filename)
        
        if path_on in data_store and path_off in data_store:
            d_on = data_store[path_on]
            d_off = data_store[path_off]
            
            # 1. Cohen's d
            m1, v1, n1 = d_off['averageSimilarity'], d_off['varianceSimilarity'], d_off['count']
            m2, v2, n2 = d_on['averageSimilarity'], d_on['varianceSimilarity'], d_on['count']
            
            pooled_var = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2)
            pooled_std = np.sqrt(pooled_var)
            
            cohens_d = (m1 - m2) / pooled_std
            
            # T-Test
            se_diff = np.sqrt(v1/n1 + v2/n2)
            t_stat = (m1 - m2) / se_diff
            
            sig = ""
            if abs(t_stat) > 2.58: sig = "**"
            elif abs(t_stat) > 1.96: sig = "*"

            # 2. OVL
            dist_off = np.array(d_off['similarityDistribution'])
            dist_on = np.array(d_on['similarityDistribution'])
            
            pmf_off = dist_off / np.sum(dist_off)
            pmf_on = dist_on / np.sum(dist_on)
            
            ovl = np.sum(np.minimum(pmf_off, pmf_on))
            
            # 3. Wasserstein
            cdf_off = np.cumsum(pmf_off)
            cdf_on = np.cumsum(pmf_on)
            bin_width = 1.0 / len(dist_off)
            wasserstein_dist = np.sum(np.abs(cdf_off - cdf_on)) * bin_width
            
            # Log results
            print(f"Model: {model_name}")
            print(f"  Mean OFF:  {m1:.4f}")
            print(f"  Mean ON:   {m2:.4f}")
            print(f"  Diff:      {(m1 - m2):.4f} (OFF - ON)")
            print(f"  T-Score:   {t_stat:.4f} {sig}")
            print(f"  Cohen's d: {cohens_d:.4f}")
            print(f"  OVL:       {ovl:.4f}")
            print(f"  Wasserstein: {wasserstein_dist:.4f}")
            print("-" * 30)
            
            metrics_results.append({
                "Model": model_name,
                "Mean_OFF": round(m1, 4),
                "Mean_ON": round(m2, 4),
                "Mean_Diff": round(m1 - m2, 4),
                "T_Score": round(t_stat, 4),
                "Cohens_d": round(cohens_d, 4),
                "OVL": round(ovl, 4),
                "Wasserstein": round(wasserstein_dist, 4)
            })

    # Save to CSV
    csv_path = os.path.join(figures_dir, 'metrics_comparison_report_v2.csv')
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["Model", "Mean_OFF", "Mean_ON", "Mean_Diff", "T_Score", "Cohens_d", "OVL", "Wasserstein"])
        writer.writeheader()
        writer.writerows(metrics_results)
    
    print(f"Metrics Report saved to: {csv_path}")

if __name__ == "__main__":
    main()
