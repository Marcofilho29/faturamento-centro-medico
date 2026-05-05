import pdfplumber
import os
import re
import json
import glob

def clean_value(val_str):
    """Converts a string like 'R$14.987,69' or '5.081,50' to float."""
    if not val_str: return 0.0
    val_str = val_str.replace('R$', '').replace('.', '').replace(',', '.').strip()
    try:
        return float(val_str)
    except ValueError:
        return 0.0

def extract_data_from_pdf(pdf_path):
    data = []
    current_month = "Desconhecido"
    
    print(f"Processando: {os.path.basename(pdf_path)}...")
    
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text: continue
            
            # Extract month from header
            month_match = re.search(r"Mês de Produção\s*:\s*(\d{4}/\d{2})", text)
            if month_match:
                current_month = month_match.group(1)
            
            lines = text.split('\n')
            for line in lines:
                # Match rows starting with 4-digit code
                # Pattern: Code Name Quantity ... Total
                match = re.match(r"^(\d{4})\s+(.+?)\s+(\d+)\s+.*?\s+R?\$?\s*([\d.,]+)$", line)
                if match:
                    code = match.group(1)
                    name = match.group(2).strip()
                    quantity = int(match.group(3))
                    total = clean_value(match.group(4))
                    
                    data.append({
                        "month": current_month,
                        "name": name,
                        "total": total
                    })
                    
    return data

def main():
    base_path = r"c:\Users\Marco\Documents\Centro Médico\Faturamento"
    pdf_files = glob.glob(os.path.join(base_path, "FAT*.pdf"))
    
    all_results = []
    for pdf_file in pdf_files:
        all_results.extend(extract_data_from_pdf(pdf_file))
    
    # Aggregate data for the dashboard
    # Structure needed: { "months": [...], "convenios": [ { name: "...", data: [...] } ] }
    
    months_set = sorted(list(set(d['month'] for d in all_results)))
    convenios_names = sorted(list(set(d['name'] for d in all_results)))
    
    dashboard_data = {
        "months": months_set,
        "convenios": []
    }
    
    # Sort by total billing first to identify small ones
    temp_convenios = []
    for i, name in enumerate(convenios_names):
        monthly_values = [sum(d['total'] for d in all_results if d['name'] == name and d['month'] == m) for m in months_set]
        if sum(monthly_values) > 0:
            temp_convenios.append({"name": name, "data": monthly_values, "total": sum(monthly_values)})
    
    temp_convenios.sort(key=lambda x: x['total'], reverse=True)
    
    # Grouping logic: Keep top 10 and group the rest into "OUTROS"
    limit = 10
    top_convenios = temp_convenios[:limit]
    other_convenios = temp_convenios[limit:]
    
    dashboard_data["convenios"] = []
    colors = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#f43f5e', '#0ea5e9', '#d946ef', '#f97316', '#84cc16']
    
    for i, c in enumerate(top_convenios):
        dashboard_data["convenios"].append({
            "name": c['name'],
            "color": colors[i % len(colors)],
            "data": c['data']
        })
        
    if other_convenios:
        others_data = [0] * len(months_set)
        for c in other_convenios:
            for j in range(len(months_set)):
                others_data[j] += c['data'][j]
        
        dashboard_data["convenios"].append({
            "name": "OUTROS (CONSOLIDADOS)",
            "color": "#94a3b8", # Gray for others
            "data": others_data
        })
    
    # Also provide the full raw list for the Ranking tab
    dashboard_data["full_ranking"] = temp_convenios
    
    dashboard_data["convenios"].sort(key=lambda x: sum(x['data']), reverse=True)
    
    # Write to data.js for the dashboard
    js_content = f"const REAL_DATA = {json.dumps(dashboard_data, indent=4, ensure_ascii=False)};"
    
    with open(os.path.join(base_path, "data.js"), "w", encoding="utf-8") as f:
        f.write(js_content)
    
    print(f"\n[OK] Sucesso! {len(all_results)} registros processados.")
    print(f"[*] {len(months_set)} meses identificados: {', '.join(months_set)}")
    print(f"[$] Faturamento total consolidado: R$ {sum(d['total'] for d in all_results):,.2f}")
    print(f"[!] Dados salvos em 'data.js'. Prontos para visualização no Dashboard.")

if __name__ == "__main__":
    main()
