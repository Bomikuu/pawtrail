#!/usr/bin/env python3
"""Persistent actor production operations; not a test runner."""
from pathlib import Path
import argparse
import json
import os
import subprocess
import sys
from actor_production.ledger import Job, atomic_json, time_summary
from actor_production.readiness import import_asset, preflight, inspect_asset
from actor_production.review import capture, write_queue, record_result, preview_url

ROOT = Path(__file__).resolve().parents[1]


def initialize(args):
    path = Path(args.job).resolve()
    if path.exists():
        raise ValueError('Job already exists; edit its manifest or resume it instead of resetting history')
    shared = ['src/game/runtime/actor-comparison-state.ts','src/game/runtime/actor-comparison-scene.ts',
              'src/game/creator/preview-models.ts','src/game/creator/state.ts',
              'src/components/game/actor-comparison.tsx','src/components/game/character-creator-editor.tsx',
              'src/components/game/shared/living-portrait.tsx','src/components/game/shared/illustration-preview.tsx',
              'src/game/actor-rig/photo-portrait-catalog.json', 'src/game/actor-rig/pixel-renderer.ts',
              'src/game/actor-rig/action-portrait.ts','src/game/actor-rig/photo-portrait-renderer.ts',
              'src/game/runtime/actor-sigil.ts','src/game/runtime/actor-preview-voice.ts',
              'package.json','package-lock.json']
    actor = {'id':args.actor,'name':args.name,'modelKind':args.model_kind,
             'previewUrl':'http://127.0.0.1:3000/play?preview=actors&skin='+args.actor,
             'voices':'omitted' if args.skip_voices else 'included',
             'voiceOmissionReason':'Explicitly omitted for this job by the owner' if args.skip_voices else '',
             'installInGame':args.install_in_game,'illustrationName':args.illustration_name or args.name,
             'illustrationVariants':['normal','enraged'],'illustrationCycleMs':5000,
             'portrait':{'collection':args.portrait_collection,'poses':['front-pout','three-quarter-left','head-tilt-smile-right'],
                         'emotions':['idle','smile','happy','sad','angry','surprised']},
             'dependencies':{'model':[{'path':args.model_file,'imports':True},args.model_assets],
               'portrait':[args.portrait_dir,{'path':'src/game/actor-rig/portrait-renderer.ts','optional':True}],
               'illustration':[args.illustration_dir,'src/game/creator/illustration-motion.ts','src/game/creator/illustration-assets.ts'],
               'icon':[args.icon,'src/components/game/shared/character-icon.tsx'],
               'preview':shared,
               'gameplay':['src/game/runtime/actors.ts','src/game/models3d/phaser-bridge.ts','src/game/stage-editor/playtest.ts','src/components/game/stage-editor.tsx']}}
    if not args.skip_voices:
        actor['dependencies']['voice']=[]  # Explicitly fill with the actual voice pack before review.
    value = {'version':1,'id':args.id or args.actor,'projectRoot':os.path.relpath(ROOT,path.parent),
             'actors':[actor],'assets':[], 'exports':{}}
    atomic_json(path,value)
    job=Job(path)
    return job.append('job.created',scope='Actor production tooling; omissions and installation are explicit',actor=args.actor)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--job',required=True,help='Persistent production manifest (JSON)')
    sub=parser.add_subparsers(dest='command',required=True)
    init=sub.add_parser('init');init.add_argument('--id');init.add_argument('--actor',required=True);init.add_argument('--name',required=True)
    init.add_argument('--model-kind',choices=['humanoid','vehicle'],default='humanoid')
    for name in ['model-file','model-assets','portrait-collection','portrait-dir','illustration-dir','icon']:
        init.add_argument('--'+name,required=True)
    init.add_argument('--illustration-name');init.add_argument('--skip-voices',action='store_true');init.add_argument('--install-in-game',action='store_true')
    start=sub.add_parser('start');start.add_argument('--name',required=True);start.add_argument('--actor',default='shared')
    start.add_argument('--kind',choices=['stage','work','wait','generation','export','review'],default='stage');start.add_argument('--parent')
    end=sub.add_parser('end');end.add_argument('--span',required=True);end.add_argument('--outcome',choices=['complete','failed','cancelled','interrupted'],default='complete');end.add_argument('--note',default='')
    imp=sub.add_parser('import');imp.add_argument('--asset',required=True);imp.add_argument('--source',required=True);imp.add_argument('--run',required=True)
    ready=sub.add_parser('ready');ready.add_argument('--stage',required=True)
    export=sub.add_parser('export');export.add_argument('--stage',required=True);export.add_argument('argv',nargs=argparse.REMAINDER)
    sub.add_parser('timing')
    sub.add_parser('queue')
    cap=sub.add_parser('capture');cap.add_argument('--case');cap.add_argument('--next',action='store_true');cap.add_argument('--session',default='actor-production')
    cap.add_argument('--wrapper',default=str(Path.home()/'.codex/skills/playwright/scripts/playwright_cli.sh'))
    cap.add_argument('--open',action='store_true',help='Open a dedicated Firefox session before capturing')
    result=sub.add_parser('review');result.add_argument('--case',required=True);result.add_argument('--result',choices=['pass','fail','blocked'],required=True);result.add_argument('--note',required=True);result.add_argument('--evidence',action='append',required=True)
    args=parser.parse_args()
    if args.command=='init':
        return initialize(args)
    job=Job(args.job)
    if args.command=='start':return job.start(args.name,args.actor,args.kind,args.parent)
    if args.command=='end':return job.end(args.span,args.outcome,args.note)
    if args.command=='import':return import_asset(job,args.asset,args.source,args.run)
    if args.command=='ready':
        value=preflight(job,args.stage)
        print(json.dumps(value,indent=2));return 0 if value['ready'] else 2
    if args.command=='export':
        command=args.argv[1:] if args.argv[:1]==['--'] else args.argv
        if not command:raise ValueError('Provide an explicit exporter command after --')
        gate=preflight(job,args.stage)
        if not gate['ready']:raise ValueError('Export blocked before output writes: '+'; '.join(gate['errors']))
        span=job.start(args.stage,'shared','export')
        try:
            done=subprocess.run(command,cwd=job.root)
            if done.returncode:raise ValueError(f'Exporter exited with {done.returncode}')
            assets={a['id']:a for a in job.data['assets']}
            # An exporter that read changing inputs cannot publish a successful receipt.
            current=preflight(job,args.stage,record=False)
            if not current['ready'] or current['inputs']!=gate['inputs']:raise ValueError('Inputs changed during export; outputs remain unaccepted')
            for identity in job.data['exports'][args.stage].get('produces',[]):
                asset=assets[identity];value=inspect_asset(job,asset,receipts=False)
                job.append('asset.ready',asset=identity,run=span['id'],**{k:v for k,v in value.items() if k!='id'})
            job.end(span['id'],note='Export finished; structural outputs ready, visual acceptance remains separate')
            return {'stage':args.stage,'outcome':'complete'}
        except BaseException as error:
            job.end(span['id'],'interrupted' if isinstance(error,KeyboardInterrupt) else 'failed',str(error));raise
    if args.command=='timing':
        value=time_summary(job);atomic_json(job.folder/'timing-summary.json',value);return value
    if args.command=='queue':
        value=write_queue(job)
        return {'complete':value['complete'],'omissions':value['omissions'],'cases':[{k:r[k] for k in ('id','kind','state','instructions','error') if k in r}for r in value['cases']]}
    if args.command=='capture':
        if bool(args.case)==bool(args.next):raise ValueError('Choose --case ID or --next')
        queue=write_queue(job)['cases']
        selected=next((r for r in queue if r['state'] in {'pending','stale','fail'} and r['kind']!='manual'),None) if args.next else next((r for r in queue if r['id']==args.case),None)
        if not selected:raise ValueError('No uncaptured case selected. Inspect queue; captured cases still need visual review.')
        if selected['state']=='blocked':raise ValueError(selected['error'])
        if args.open:
            actor=next(a for a in job.data['actors'] if a['id']==selected['actor'])
            opening=job.start('Open Firefox review session',actor['id'],'review')
            try:
                opened=subprocess.run(['bash',args.wrapper,'--session='+args.session,'open',preview_url(actor),'--browser','firefox'],cwd=job.root,capture_output=True,text=True,timeout=60)
                if opened.returncode or '### Error' in opened.stdout:raise ValueError(opened.stdout+opened.stderr)
                job.end(opening['id'],note='Dedicated Firefox authoring session')
            except BaseException as error:
                job.end(opening['id'],'interrupted' if isinstance(error,KeyboardInterrupt) else 'failed',str(error));raise
        value=capture(job,selected['id'],args.wrapper,args.session);write_queue(job);return value
    if args.command=='review':
        value=record_result(job,args.case,args.result,args.note,args.evidence);write_queue(job);return value


if __name__=='__main__':
    try:
        value=main()
        if isinstance(value,int):sys.exit(value)
        print(json.dumps(value,indent=2,ensure_ascii=False))
    except (ValueError,OSError,KeyError,subprocess.SubprocessError) as error:
        print(json.dumps({'error':str(error)}),file=sys.stderr);sys.exit(2)
