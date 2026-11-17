"""Opt-in CPU audition adapter for the existing cached VoxCPM2 speaker/model.

Quantize only LM Linear weights, one layer at a time, using PyTorch's CPU int8
kernels. Keep embeddings/activations in the source dtype and AudioVAE unchanged.
This is authoring-only; never shipped to the game or enabled for other sessions.
"""
import sys
import torch
from torch import nn


class CPULinear(nn.Module):
    def __init__(self, original):
        super().__init__()
        self.in_features, self.out_features = original.in_features, original.out_features
        dense = nn.Linear(self.in_features, self.out_features, bias=original.bias is not None, device='meta')
        dense.weight = nn.Parameter(original.weight.detach().float(), requires_grad=False)
        if original.bias is not None:
            dense.bias = nn.Parameter(original.bias.detach().float(), requires_grad=False)
        container = nn.Sequential(dense).eval()
        self.linear = torch.ao.quantization.quantize_dynamic(container, {nn.Linear}, dtype=torch.qint8, inplace=True)[0]

    def forward(self, value):
        return self.linear(value.float()).to(dtype=value.dtype)


def prepare(model):
    torch.set_num_threads(2)
    core = model.tts_model
    if next(core.parameters()).device.type != 'cpu':
        raise RuntimeError('This audition adapter is CPU-only.')
    count = 0
    def replace(parent):
        nonlocal count
        for name, child in list(parent.named_children()):
            if isinstance(child, nn.Linear):
                setattr(parent, name, CPULinear(child)); count += 1
            else:
                replace(child)
    for name in ['base_lm', 'residual_lm']:
        replace(getattr(core, name))
    if not count:
        raise RuntimeError('No LM Linear layers were converted; do not retry the paging-heavy run.')
    print(f'PawTrail CPU audition: {count} LM Linear layers use int8; original AudioVAE and speaker retained.', file=sys.stderr, flush=True)
    return model
