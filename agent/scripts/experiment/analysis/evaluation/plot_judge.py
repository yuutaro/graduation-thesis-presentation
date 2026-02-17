
import sys
import os
import json
import matplotlib.pyplot as plt
import numpy as np

def main():
    if len(sys.argv) < 2:
        print("Usage: python plot_judge.py <judge_results.json>")
        sys.exit(1)

    json_file = sys.argv[1]
    
    if not os.path.exists(json_file):
        print("File not found.")
        sys.exit(1)

    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Organize data: model_name -> { 'rag_on': {scores}, 'rag_off': {scores} }
    models_data = {}
    
    for entry in data:
        model = entry['modelName']
        rag = 'ON' if entry['rag'] else 'OFF'
        
        if model not in models_data:
            models_data[model] = {}
        
        models_data[model][rag] = {
            'Coherence': entry['coherence'],
            'Specificity': entry['specificity'],
            'HumanLikeness': entry['humanLikeness']
        }

    models = sorted(models_data.keys())
    metrics = ['Coherence', 'Specificity', 'HumanLikeness']

    # --- Plot: Grouped Bar Chart for each Metric ---
    # We create one subplot per metric
    
    fig, axes = plt.subplots(1, 3, figsize=(18, 6), sharey=True)
    
    bar_width = 0.35
    opacity = 0.8

    for i, metric in enumerate(metrics):
        ax = axes[i]
        
        index = np.arange(len(models))
        
        # Extract values
        rag_on_vals = []
        rag_off_vals = []
        
        for m in models:
            rag_on_vals.append(models_data[m].get('ON', {}).get(metric, 0))
            rag_off_vals.append(models_data[m].get('OFF', {}).get(metric, 0))
            
        rects1 = ax.bar(index, rag_on_vals, bar_width,
                        alpha=opacity, color='blue', label='RAG ON')
        
        rects2 = ax.bar(index + bar_width, rag_off_vals, bar_width,
                        alpha=opacity, color='orange', label='RAG OFF')

        ax.set_xlabel('Model')
        ax.set_title(metric)
        ax.set_xticks(index + bar_width / 2)
        ax.set_xticklabels(models, rotation=45)
        
        # Add values on top
        for rect in rects1 + rects2:
            height = rect.get_height()
            if height > 0:
                ax.annotate(f'{height:.2f}',
                            xy=(rect.get_x() + rect.get_width() / 2, height),
                            xytext=(0, 3),  # 3 points vertical offset
                            textcoords="offset points",
                            ha='center', va='bottom', fontsize=9)

    axes[0].set_ylabel('Score (1-5)')
    axes[0].legend(loc='lower right')
    
    plt.suptitle('LLM Evaluation: Quality Comparison by Model & RAG', fontsize=16)
    plt.tight_layout()
    plt.subplots_adjust(top=0.85)

    # Save
    script_dir = os.path.dirname(os.path.abspath(__file__))
    figures_dir = os.path.join(script_dir, 'figures')
    if not os.path.exists(figures_dir):
        os.makedirs(figures_dir)
        
    output_path = os.path.join(figures_dir, 'judge_comparison.png')
    plt.savefig(output_path, dpi=300)
    print(f"Comparison chart saved to: {output_path}")

if __name__ == "__main__":
    main()
