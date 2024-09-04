import { CandlestickData, ColorType, createChart, ISeriesApi, Time, UTCTimestamp } from "lightweight-charts";
import React, { useEffect, useRef } from "react";
import { createRipples } from 'react-ripples';
import { BehaviorSubject, fromEvent, interval, Subject } from "rxjs";
import { debounceTime, takeUntil } from "rxjs/operators";
import ChartLabelComponent from "./ChartLabelComponent";


const CryptoChart: React.FC = () => {
    const chartContainerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<any>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const dataSubject = useRef(new BehaviorSubject<CandlestickData<Time>[]>([])).current;
    const destroy$ = useRef(new Subject<void>()).current;
    const INITIAL_CANDLE_COUNT = 50;
    const INTERVAL_TIME = 10;
    const screenTappedSubject = useRef(new BehaviorSubject<number>(0)).current;

    const MyRipples = createRipples({
        // color: 'rgba(0, 0, 0, .5)',
        color: 'purple',
        during: 1000,
    })

    useEffect(() => {
        if (!chartContainerRef.current || chartRef.current) return;

        chartRef.current = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#000' },
                textColor: "white",
                attributionLogo: false
            },
            grid: {
                vertLines: { color: "#333" },
                horzLines: { color: "#333" }
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: 'blue',
                ticksVisible: true,
            },
            rightPriceScale: {
                borderColor: 'blue',
                mode: 1,
                autoScale: true,
                entireTextOnly: false,
                ticksVisible: true,
                textColor: 'green'
            },
            autoSize: true,
        });

        candlestickSeriesRef.current = chartRef.current.addCandlestickSeries();

        const initialData = generateInitialData();
        dataSubject.next(initialData);
        candlestickSeriesRef.current?.setData(initialData);

        const firstTime = initialData[0].time as unknown as number;
        const lastTime = initialData[initialData.length - 1].time as unknown as number;
        const halfRange = (lastTime - firstTime) / 2;
        chartRef.current.timeScale().setVisibleRange({
            from: firstTime - halfRange,
            to: lastTime + halfRange,
        });

        const dataUpdate$ = interval(1000 * INTERVAL_TIME).pipe(
            takeUntil(destroy$)
        ).subscribe(() => {
            updateChartData();
        });

        chartRef.current.subscribeClick((param: { seriesData: any }) => {
            if (!param) return;
            const { seriesData } = param;
            if (seriesData.has(candlestickSeriesRef.current!)) {
                const candlestickData = seriesData.get(candlestickSeriesRef.current!);
                if (candlestickData && 'close' in candlestickData) {
                    const currentValue = screenTappedSubject.value;
                    const nextValue = (currentValue + 1) % 3;
                    screenTappedSubject.next(nextValue);
                }
            }
        });


        return () => {
            destroy$.next();
            destroy$.complete();
            dataUpdate$.unsubscribe();
            chartRef.current?.remove();
            chartRef.current = null;
        };
    }, [dataSubject, destroy$]);

    useEffect(() => {
        const resize$ = fromEvent(window, 'resize').pipe(
            debounceTime(300),
            takeUntil(destroy$)
        ).subscribe(() => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.resize(chartContainerRef.current.clientWidth, 300);
            }
        });

        return () => {
            resize$.unsubscribe();
        };
    }, [destroy$]);

    const updateChartData = () => {
        if (!candlestickSeriesRef.current) return;

        const latestData = dataSubject.value;
        const lastItem = latestData[latestData.length - 1];
        const lastTime: any = typeof lastItem.time === 'string' ? parseInt(lastItem.time, 10) : lastItem.time;

        const time: UTCTimestamp = (lastTime + INTERVAL_TIME) as UTCTimestamp;
        const newData = generateRandomCandle(time, lastItem.close);

        const updatedData = [...latestData.slice(1), newData];

        dataSubject.next(updatedData);
        candlestickSeriesRef.current.setData(updatedData);
    };

    const generateInitialData = (): CandlestickData[] => {
        const data: CandlestickData[] = [];
        let time: UTCTimestamp = Math.floor(Date.now() / 1000) as UTCTimestamp;
        let price = 100;
        for (let i = 0; i < INITIAL_CANDLE_COUNT; i++) {
            const candle = generateRandomCandle(time, price);
            data.push(candle);
            time = (time + INTERVAL_TIME) as UTCTimestamp;
            price = candle.close;
        }

        return data;
    };

    const generateRandomCandle = (time: UTCTimestamp, price?: number): CandlestickData<UTCTimestamp> => {

        const open = price || Math.random() * 100 + 50;
        const closeOffset = Math.random() * INTERVAL_TIME;

        const close = getClosingValue(open, closeOffset);
        const high = Math.max(open, close) + Math.random() * 5;
        const low = Math.min(open, close) - Math.random() * 5;
        const color = close > open ? 'green' : 'red';

        return {
            time: time,
            open,
            high,
            low,
            close,
            borderColor: color,
            wickColor: color,
            color
        };
    };

    const getClosingValue = (open: number, offset: number) => {
        let response;
        switch (screenTappedSubject.value) {
            case 1:
                response = open + offset
                break;
            case 2:
                response = open - offset
                break;
            default:
                response = Math.random() > 0.5 ? open + offset : open - offset
                break;
        }
        return response
    }


    return (
        <div
            className="relative w-full flex flex-col items-start h-screen justify-start bg-black overflow-visible shadow-md pb-10"
        >
            <ChartLabelComponent />
            <div id="chartArea" className="h-full w-full">
                <MyRipples className="h-full relative  w-full" >
                    <div ref={chartContainerRef} className="h-full relative  w-full overflow-hidden" />
                </MyRipples>
            </div>
        </div>
    );
};

export default CryptoChart;
