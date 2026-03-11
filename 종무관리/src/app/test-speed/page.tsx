'use client';

import { useState } from 'react';
import { getPostsByCategoryAction } from '../board/actions';

export default function SpeedTestPage() {
    const [results, setResults] = useState<{ type: string; time: number; count: number }[]>([]);
    const [loading, setLoading] = useState(false);

    const testSpeed = async (category: 'NOTICE' | 'RESOURCE' | 'FREE') => {
        setLoading(true);
        const start = performance.now();
        try {
            const data = await getPostsByCategoryAction(category, 10, 0);
            const end = performance.now();
            const duration = Math.round(end - start);
            setResults(prev => [{ type: category, time: duration, count: data.length }, ...prev]);
        } catch (error) {
            console.error(error);
            alert('테스트 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">🚀 데이터 서버 통신 속도 테스트</h1>
            <p className="mb-6 text-gray-600">
                이 페이지는 다른 요소 없이 <strong>데이터 서버(호주)에서 게시판 내용만</strong> 직접 가져오는 속도를 측정합니다.
            </p>

            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => testSpeed('NOTICE')}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
                >
                    공지사항 테스트
                </button>
                <button
                    onClick={() => testSpeed('RESOURCE')}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
                >
                    자료실 테스트
                </button>
                <button
                    onClick={() => testSpeed('FREE')}
                    disabled={loading}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
                >
                    자유게시판 테스트
                </button>
            </div>

            {loading && (
                <div className="text-center py-4 text-blue-500 font-bold animate-pulse">
                    데이터를 가져오는 중...
                </div>
            )}

            <div className="space-y-4">
                <h2 className="font-bold text-lg border-b pb-2">테스트 결과 (최신순)</h2>
                {results.length === 0 && <p className="text-gray-400">버튼을 눌러 테스트를 시작하세요.</p>}
                {results.map((res, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                        <span className="font-bold">{res.type} (10건)</span>
                        <span className={`text-xl font-mono ${res.time > 3000 ? 'text-red-500' : 'text-green-600'}`}>
                            {res.time}ms ({(res.time / 1000).toFixed(2)}초)
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-12 p-4 bg-amber-50 rounded-lg text-sm text-amber-800">
                <strong>💡 결과 해석:</strong>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>3000ms(3초) 이상: 물리적 거리 외에 별도의 지연이 발생하고 있음</li>
                    <li>1500ms(1.5초) 내외: 한국-호주 간 정상적인 광속 응답 속도</li>
                    <li>만약 이 페이지는 빠른데 메인 대시보드만 느리다면, 화면을 그리는 과정(렌더링)의 문제입니다.</li>
                </ul>
            </div>
        </div>
    );
}
