import type {Metadata} from 'next'
import GameClient from '@/features/neighborhood/client'
export const metadata:Metadata={title:'Play PawTrail — Homes & Neighborhood',description:'Explore, make animal friends, and bring a little kindness to the neighborhood.',alternates:{canonical:'/play'},robots:{index:false,follow:true}}
export default function PlayPage(){return <GameClient/>}
