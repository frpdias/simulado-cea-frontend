<script lang="ts">
import { onMount } from 'svelte';
import Chart from 'chart.js/auto';

export let labels: string[] = [];
export let data: number[] = [];
let canvas: HTMLCanvasElement;
let chart: Chart;

onMount(() => {
    if (canvas && labels.length && data.length) {
        chart = new Chart(canvas, {
            type: 'radar',
            data: {
                labels,
                datasets: [{
                    label: 'Aproveitamento por Tema',
                    data,
                    backgroundColor: 'rgba(124, 58, 237, 0.2)',
                    borderColor: '#7c3aed',
                    pointBackgroundColor: '#1976d2',
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    r: {
                        min: 0,
                        max: 100,
                        ticks: { stepSize: 20, color: '#222' },
                        pointLabels: { color: '#1976d2', font: { size: 14 } }
                    }
                },
                plugins: {
                    legend: { display: false },
                }
            }
        });
    }
    return () => chart?.destroy();
});
</script>

<canvas bind:this={canvas} width="400" height="400"></canvas>

<style>
canvas {
    margin: 0 auto;
    display: block;
    max-width: 100%;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px #e0e7ff;
}
</style>
