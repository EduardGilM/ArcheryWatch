import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from replay_detector import replay, evaluate


class ReplayTest(unittest.TestCase):
    def test_impulse_at_two_rates(self):
        for rate in (50,100):
            rows=[(t,0,0,5000 if t==1000 else 1000) for t in range(0,4001,1000//rate)]
            shots=replay(rows,rate)
            self.assertEqual([s['t_ms'] for s in shots],[1000])
            self.assertGreaterEqual(shots[0]['peak_mg'],4000)
            self.assertGreaterEqual(shots[0]['settle_ms'],50)

    def test_single_quiet_sample_is_not_recovery(self):
        rows=[(t,0,0,5000 if t==1000 else (1500 if 1060<t<1200 else 1000)) for t in range(0,4001,10)]
        shot=replay(rows)[0]
        self.assertGreaterEqual(shot['settle_ms'],200)

    def test_no_shot_in_constant_gravity(self):
        self.assertEqual(replay([(t,0,0,1000) for t in range(0,4000,10)]),[])

    def test_one_to_one_evaluation(self):
        report=evaluate([{'t_ms':1000},{'t_ms':1010},{'t_ms':7000}],[{'t_ms':1000,'label':'shot'},{'t_ms':3000,'label':'shot'}])
        self.assertEqual((report['true_positives'],report['false_positives'],report['missed'],report['duplicates']),(1,2,1,1))

    def test_partial_window_and_nonmonotonic(self):
        rows=[(t,0,0,5000 if t==1000 else 1000) for t in range(0,1100,10)]
        self.assertTrue(replay(rows)[0]['incomplete'])
        with self.assertRaises(ValueError): replay([(1,0,0,1000),(0,0,0,1000)])


if __name__=='__main__': unittest.main()
