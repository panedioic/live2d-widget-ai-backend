def trim_context(history: list, max_tokens=4096):
    """上下文修剪工具"""
    current_length = sum(len(msg["content"]) for msg in history)
    while current_length > max_tokens and len(history) > 1:
        removed = history.pop(1)
        current_length -= len(removed["content"])
    return history

def generate_summary(history):
    """生成对话摘要"""
    # ...摘要生成逻辑...
    pass