
import sys
import os
import csv
import json
import matplotlib.pyplot as plt

def main():
    # Hardcoded experiment directories
    base_dir = "/home/yuutaro/dev/payment-platform-2/agent/experiments"
    experiment_dirs = [
        "2026-01-31T11-47-56-129Z_gpt-5.2-2025-12-11_rag_on",
        "2026-01-31T11-47-56-129Z_gpt-5.2-2025-12-11_rag_off",
        "2026-01-31T11-47-56-129Z_gpt-5-mini-2025-08-07_rag_on",
        "2026-01-31T11-47-56-129Z_gpt-5-mini-2025-08-07_rag_off",
        "2026-01-29T08-30-40-800Z_gemini-3-pro-preview_rag_on",
        "2026-01-29T08-30-40-796Z_gemini-3-pro-preview_rag_off",
        "2026-01-29T08-30-40-815Z_gemini-3-flash-preview_rag_on",
        "2026-01-29T08-30-40-799Z_gemini-3-flash-preview_rag_off"
    ]

    csv_files = [os.path.join(base_dir, d, "vocabulary_growth.csv") for d in experiment_dirs]
    
    # Custom color map
    color_map = {
        # Gemini 3 Pro
        "gemini-3-pro-preview_rag_on": "#3333ff",
        "gemini-3-pro-preview_rag_off": "#000066",
        # Gemini 3 Flash
        "gemini-3-flash-preview_rag_on": "#00ff99",
        "gemini-3-flash-preview_rag_off": "#339966",
        # GPT 5.2
        "gpt-5.2-2025-12-11_rag_on": "#ff0000",
        "gpt-5.2-2025-12-11_rag_off": "#800000",
        # GPT 5 Mini
        "gpt-5-mini-2025-08-07_rag_on": "#ffff00",
        "gpt-5-mini-2025-08-07_rag_off": "#cc9900",
    }
    
    # Setup plot style
    plt.figure(figsize=(10, 6))
    
    for file_path in csv_files:
        steps = []
        words = []
        
        if not os.path.exists(file_path):
            print(f"Warning: File not found {file_path}")
            continue

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    steps.append(int(row['Step']))
                    words.append(int(row['UniqueWords']))
            
            # Determine label from path
            dir_name = os.path.basename(os.path.dirname(file_path))
            
            label_text = dir_name
            color = None
            
            # Determine Color Key from directory name
            parts = dir_name.split('_')
            # Format: timestamp_MODEL_rag_STATUS
            color_key = None
            if 'rag' in parts:
                rag_idx = parts.index('rag')
                color_key = "_".join(parts[1:])
            
            # Determine Label
            config_path = os.path.join(os.path.dirname(file_path), 'config.json')
            if os.path.exists(config_path):
                try:
                    with open(config_path, 'r') as cf:
                        config = json.load(cf)
                        model = config.get('model', 'Unknown')
                        rag_status = 'ON' if config.get('rag') else 'OFF'
                        label_text = f"{model} (RAG {rag_status})"
                except:
                    pass
            
            if color_key:
                assigned_color = color_map.get(color_key, '#888888')
            else:
                assigned_color = '#888888'

            # Set linestyle based on RAG status
            linestyle = '-' # Default solid for RAG ON
            if "rag_off" in dir_name.lower():
                linestyle = ':' # Dotted for RAG OFF

            plt.plot(steps, words, label=label_text, linewidth=2, color=assigned_color, linestyle=linestyle)
            
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            continue

    plt.title('Vocabulary Growth: Unique Words vs Generation Steps', fontsize=14)
    plt.xlabel('Generated Scenarios (Steps)', fontsize=12)
    plt.ylabel('Cumulative Unique Words', fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.legend(fontsize=10)
    plt.tight_layout()
    
    # Save to ./figures/ directory relative to this script
    if len(csv_files) > 0:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        figures_dir = os.path.join(script_dir, 'figures')
        
        # Ensure directory exists
        if not os.path.exists(figures_dir):
            os.makedirs(figures_dir)
            
        output_path = os.path.join(figures_dir, 'vocabulary_growth_comparison.png')
        plt.savefig(output_path, dpi=300)
        print(f"Graph saved to: {output_path}")
    else:
        print("No valid files processed.")

if __name__ == "__main__":
    main()
